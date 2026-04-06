import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import axios from 'axios';
import { Recommendation, RecommendationDocument } from './recommendation.schema';
import { HrDecision, HrDecisionDocument } from './hr-decision.schema';
import { Activity } from '../activity/activity.schema';
import { User } from '../users/shemas/user.shema';
import { Skill } from '../skill/skill.schema';
import {
  parseCvSkillLevels,
  calculateSkillMatchScore,
  calculateContextScore,
  calculateProgressionScore,
  calculateFinalScore,
  EmployeeSkillLevel,
  RequiredSkillInput,
} from '../activity/scoring.util';

// ── LLM log helper ──────────────────────────────────────────────────────────
function appendLlmLog(content: string) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    fs.appendFileSync(path.join(logDir, `llm-${date}.log`), content);
  } catch { /* non-blocking */ }
}

export interface LLMRanking {
  employeeId: string;
  score: number;
  reasons: string[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly ollamaBaseUrl = 'http://localhost:11434';
  private readonly model = 'qwen2.5:14b';

  constructor(
    @InjectModel(Recommendation.name) private recoModel: Model<RecommendationDocument>,
    @InjectModel(HrDecision.name)     private decisionModel: Model<HrDecisionDocument>,
    @InjectModel(Activity.name)       private activityModel: Model<Activity>,
    @InjectModel(User.name)           private userModel: Model<User>,
    @InjectModel(Skill.name)          private skillModel: Model<Skill>,
  ) {}

  // ── 1. Retrieve top 100 employees scored for an activity ──────────────────
  async getTop100(activityId: string) {
    const activity = await this.activityModel
      .findById(activityId)
      .populate('requiredSkills.skillId')
      .exec();
    if (!activity) throw new NotFoundException(`Activity ${activityId} not found`);

    const requiredSkills: RequiredSkillInput[] = (activity as any).requiredSkills
      .filter((rs: any) => rs.skillId != null && typeof rs.skillId === 'object')
      .map((rs: any) => {
        const skill = rs.skillId as any;
        return {
          skillId: String(skill._id),
          skillName: skill.name ?? '',
          level: rs.level,
          contributionToScore: rs.contributionToScore ?? 1,
        };
      });

    const contextScore = calculateContextScore((activity as any).context ?? '');

    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const skillNameMap = new Map<string, string>(
      allSkills.map((s) => [s.name.toUpperCase(), String(s._id)]),
    );

    const employees = await this.userModel
      .find({ role: 'EMPLOYEE' })
      .populate('skills', 'name')
      .lean();

    const results: {
      rank: number;
      employee: any;
      skillMatchScore: number;
      contextScore: number;
      progressionScore: number;
      totalScore: number;
      employeeSkills: EmployeeSkillLevel[];
    }[] = [];

    for (const emp of employees) {
      let employeeSkills: EmployeeSkillLevel[] = [];
      if ((emp as any).cv) {
        try {
          const cvPath = (emp as any).cv.startsWith('/')
            ? (emp as any).cv
            : resolve(process.cwd(), (emp as any).cv);
          if (existsSync(cvPath)) {
            const cvText = await readFile(cvPath, 'utf-8');
            employeeSkills = parseCvSkillLevels(cvText, skillNameMap);
          }
        } catch { /* skip */ }
      }
      if (employeeSkills.length === 0 && (emp as any).skills?.length) {
        employeeSkills = ((emp as any).skills as any[]).map((s: any) => ({
          skillId: String(s._id ?? s),
          skillName: s.name ?? '',
          level: 'LOW',
        }));
      }

      const skillMatch  = calculateSkillMatchScore(employeeSkills, requiredSkills);
      const progression = calculateProgressionScore(employeeSkills, requiredSkills);
      const total       = calculateFinalScore(skillMatch, progression, contextScore);

      results.push({
        rank: 0,
        employee: { _id: emp._id, name: (emp as any).name, email: (emp as any).email },
        skillMatchScore: skillMatch,
        contextScore,
        progressionScore: progression,
        totalScore: total,
        employeeSkills,
      });
    }

    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((r, i) => (r.rank = i + 1));
    return { activity, candidates: results.slice(0, 100) };
  }

  // ── 2. Load prompt template from /prompts/<name>.txt ─────────────────────
  private loadPrompt(name: string): string {
    const promptPath = path.join(process.cwd(), 'prompts', `${name}.txt`);
    return fs.readFileSync(promptPath, 'utf-8');
  }

  // ── 3. Build prompt + call Ollama + save to DB ────────────────────────────
  async generateAndSave(
    activityId: string,
    top_k = 10,
    weights = { skillMatch: 0.40, progression: 0.30, context: 0.30 },
  ): Promise<RecommendationDocument> {
    const { activity, candidates } = await this.getTop100(activityId);
    const startGeneration = Date.now();

    // Build prompt
    const template = this.loadPrompt('recommendation');

    const activitySkillsText = ((activity as any).requiredSkills ?? [])
      .filter((rs: any) => rs.skillId != null && typeof rs.skillId === 'object')
      .map((rs: any) => {
        const skill = rs.skillId as any;
        return `${skill?.name ?? rs.skillId} (required: ${(rs.level as string).toUpperCase()})`;
      })
      .join(', ');

    const employeesText = candidates
      .slice(0, 20)
      .map((c) => {
        const skills = c.employeeSkills
          .slice(0, 8)
          .map((es) => `${es.skillName}:${es.level.toUpperCase()}`)
          .join(', ');
        return (
          `#${c.rank} | ID: ${c.employee._id} | ${c.employee.name}` +
          ` | AlgoTotal:${c.totalScore.toFixed(1)}` +
          ` | skillMatch:${c.skillMatchScore.toFixed(1)}` +
          ` | progression:${c.progressionScore.toFixed(1)}` +
          ` | context:${c.contextScore.toFixed(1)}` +
          ` | Skills: ${skills || 'none'}`
        );
      })
      .join('\n');

    const prompt = template
      .replace(/\{\{top_k\}\}/g, String(top_k))
      .replace(/{{activity\.title}}/g,       (activity as any).title ?? '')
      .replace(/{{activity\.type}}/g,        (activity as any).type ?? '')
      .replace(/{{activity\.context}}/g,     (activity as any).context ?? '')
      .replace(/{{activity\.description}}/g, (activity as any).description ?? '')
      .replace(/{{activity\.skills}}/g,      activitySkillsText)
      .replace('{{employees}}',              employeesText)
      .replace('{{weight_skill}}',           Math.round(weights.skillMatch  * 100).toString())
      .replace('{{weight_progression}}',     Math.round(weights.progression * 100).toString())
      .replace('{{weight_context}}',         Math.round(weights.context     * 100).toString());

    // Call Ollama — fallback sur scoring algo si Ollama indisponible
    let parsed: any;
    try {
      const raw = await this.callOllama(prompt, `recommendation — activity: ${(activity as any).title}`, top_k);
      this.logger.log(`[LLM] Raw response (${raw.length} chars): ${raw.slice(0, 200)}…`);
      parsed = JSON.parse(raw);
      this.logger.log(`[LLM] Parsed ${parsed.rankings?.length ?? 0} rankings`);
    } catch (err: any) {
      this.logger.warn(`[Ollama] indisponible (${err.message}) — fallback scoring algo`);
      parsed = {
        source: 'algo-fallback',
        rankings: candidates.slice(0, top_k).map((c) => ({
          employeeId: String(c.employee._id),
          score: c.totalScore,
          reasons: [
            `Skill Match : ${c.skillMatchScore.toFixed(1)}/100`,
            `Progression : ${c.progressionScore.toFixed(1)}/100`,
            `Context     : ${c.contextScore.toFixed(1)}/100`,
            'Ollama indisponible — classement basé sur le moteur mathématique uniquement.',
          ],
        })),
      };
    }

    // Save to DB — chaque génération crée une nouvelle entrée (historique)
    const doc = await this.recoModel.create({
      activityId,
      jsonOllama: { ...parsed, elapsedMs: Date.now() - startGeneration },
    });

    return doc;
  }

  /** Génère les recommandations pour toutes les activités séquentiellement */
  async generateAll(
    top_k = 5,
    weights = { skillMatch: 0.40, progression: 0.30, context: 0.30 },
  ) {
    const activities = await this.activityModel.find({}).lean();
    const results: { activityId: string; title: string; elapsedMs: number; rankings: number; error?: string }[] = [];

    for (const activity of activities) {
      try {
        const doc = await this.generateAndSave(String(activity._id), top_k, weights);
        results.push({
          activityId: String(activity._id),
          title: (activity as any).title,
          elapsedMs: doc.jsonOllama?.elapsedMs ?? 0,
          rankings: doc.jsonOllama?.rankings?.length ?? 0,
        });
      } catch (err: any) {
        results.push({
          activityId: String(activity._id),
          title: (activity as any).title,
          elapsedMs: 0,
          rankings: 0,
          error: err.message,
        });
      }
    }
    return results;
  }

  // ── 4. Retrieve saved recommendation for an activity ─────────────────────
  /** Dernière recommandation (la plus récente) */
  async findByActivity(activityId: string): Promise<RecommendationDocument | null> {
    return this.recoModel.findOne({ activityId }).sort({ createdAt: -1 }).exec();
  }

  /** Tout l'historique des recommandations pour une activité */
  async findAllByActivity(activityId: string): Promise<RecommendationDocument[]> {
    return this.recoModel.find({ activityId }).sort({ createdAt: -1 }).exec();
  }

  // ── 5. HR Decisions (feedback loop) ──────────────────────────────────────
  async saveDecision(
    activityId: string,
    body: { employeeId: string; decision: 'approved' | 'rejected'; aiScore?: number; aiReasons?: string[]; hrComment?: string },
  ): Promise<HrDecisionDocument> {
    return this.decisionModel.findOneAndUpdate(
      { activityId, employeeId: body.employeeId },
      { $set: { decision: body.decision, aiScore: body.aiScore, aiReasons: body.aiReasons ?? [], hrComment: body.hrComment } },
      { upsert: true, returnDocument: 'after' },
    );
  }

  async getDecisions(activityId: string): Promise<HrDecisionDocument[]> {
    return this.decisionModel.find({ activityId }).lean();
  }

  // ── 6. Ollama streaming call ──────────────────────────────────────────────
  private async callOllama(prompt: string, context?: string, top_k = 5): Promise<string> {
    const startTime = Date.now();
    const ts = new Date().toISOString();

    this.logger.log(
      `[Ollama] START — model: ${this.model}, prompt: ${prompt.length} chars${context ? ` [${context}]` : ''}`,
    );

    appendLlmLog(
      `\n${'='.repeat(80)}\n` +
      `TIMESTAMP : ${ts}\n` +
      `CONTEXT   : ${context ?? 'n/a'}\n` +
      `MODEL     : ${this.model}\n` +
      `PROMPT (${prompt.length} chars)\n` +
      `${'-'.repeat(40)}\n` +
      `${prompt}\n` +
      `${'-'.repeat(40)}\n`,
    );

    const response = await axios.post(
      `${this.ollamaBaseUrl}/api/generate`,
      {
        model: this.model,
        prompt,
        stream: true,
        format: 'json',
        options: { temperature: 0.1, num_predict: Math.max(1000, top_k * 250), num_ctx: 4096 },
      },
      { responseType: 'stream' },
    );

    return new Promise((resolve, reject) => {
      let fullResponse = '';
      let tokenCount = 0;
      let lastLogAt = Date.now();

      response.data.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n').filter(Boolean)) {
          try {
            const obj = JSON.parse(line);
            if (obj.response) {
              fullResponse += obj.response;
              tokenCount++;
            }
            const now = Date.now();
            if (now - lastLogAt >= 5000) {
              this.logger.log(`[Ollama] generating… ${tokenCount} tokens — ${Math.round((now - startTime) / 1000)}s elapsed`);
              lastLogAt = now;
            }
            if (obj.done) {
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              this.logger.log(`[Ollama] DONE — ${tokenCount} tokens in ${elapsed}s`);
              appendLlmLog(
                `RESPONSE (${tokenCount} tokens, ${elapsed}s)\n` +
                `${'-'.repeat(40)}\n` +
                `${fullResponse}\n`,
              );
              resolve(fullResponse);
            }
          } catch { /* partial chunk */ }
        }
      });

      response.data.on('error', (err: Error) => {
        this.logger.error(`[Ollama] stream error: ${err.message}`);
        appendLlmLog(`ERROR: ${err.message}\n`);
        reject(err);
      });
    });
  }
}
