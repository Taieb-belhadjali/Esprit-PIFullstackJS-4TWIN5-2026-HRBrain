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
  LEVEL_ORDINAL,
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

export type GenerationStatus = 'running' | 'done' | 'error';

export interface GenerationState {
  status: GenerationStatus;
  startedAt: Date;
  finishedAt?: Date;
  error?: string;
  top_k?: number;
}

/** Normalise les caractères mal encodés (Latin-1 → UTF-8) dans les noms */
function fixEncoding(str: string): string {
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch {
    return str;
  }
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly ollamaBaseUrl = 'http://localhost:11434';
  private readonly model = 'qwen2.5:14b-instruct-q4_K_M';

  /** Statut des générations en cours, indexé par activityId */
  private readonly generationStatus = new Map<string, GenerationState>();

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
    // Marquer comme en cours
    this.generationStatus.set(activityId, { status: 'running', startedAt: new Date(), top_k });

    try {
      const result = await this._doGenerate(activityId, top_k, weights);
      this.generationStatus.set(activityId, {
        status: 'done',
        startedAt: this.generationStatus.get(activityId)!.startedAt,
        finishedAt: new Date(),
        top_k,
      });
      return result;
    } catch (err: any) {
      this.generationStatus.set(activityId, {
        status: 'error',
        startedAt: this.generationStatus.get(activityId)!.startedAt,
        finishedAt: new Date(),
        error: err.message,
        top_k,
      });
      throw err;
    }
  }

  getGenerationStatus(activityId: string): GenerationState | null {
    return this.generationStatus.get(activityId) ?? null;
  }

  private async _doGenerate(
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
        return `${skill?.name ?? rs.skillId} (required: ${(rs.level as string).toUpperCase()}, weight: ${rs.contributionToScore ?? 1})`;
      })
      .join(', ');

    const requiredSkillNames = ((activity as any).requiredSkills ?? [])
      .filter((rs: any) => rs.skillId != null && typeof rs.skillId === 'object')
      .map((rs: any) => (rs.skillId as any).name as string)
      .join(', ');

    // Primary required skill name for R3 examples
    const primarySkillName = ((activity as any).requiredSkills ?? [])
      .filter((rs: any) => rs.skillId != null && typeof rs.skillId === 'object')
      .sort((a: any, b: any) => (b.contributionToScore ?? 1) - (a.contributionToScore ?? 1))[0]
      ?.skillId?.name ?? 'the required skill';

    // Load past HR decisions FIRST — needed to filter candidates
    const pastDecisions = await this.decisionModel.find({ activityId }).lean();
    const rejectedIds = new Set(
      pastDecisions.filter((d) => d.decision === 'rejected').map((d) => String(d.employeeId)),
    );
    const approvedIds = new Set(
      pastDecisions.filter((d) => d.decision === 'approved').map((d) => String(d.employeeId)),
    );

    // Build candidate list: approved first, then non-decided (no rejected), capped at 20
    const top100 = candidates.slice(0, 100);
    const approvedCandidates = top100.filter((c) => approvedIds.has(String(c.employee._id)));
    const undecidedCandidates = top100.filter(
      (c) => !approvedIds.has(String(c.employee._id)) && !rejectedIds.has(String(c.employee._id)),
    );
    const filteredCandidates = [...approvedCandidates, ...undecidedCandidates].slice(0, 20);
    filteredCandidates.forEach((c, i) => (c.rank = i + 1));

    const reqSkillsForPrompt = ((activity as any).requiredSkills ?? [])
      .filter((rs: any) => rs.skillId != null && typeof rs.skillId === 'object')
      .sort((a: any, b: any) => (b.contributionToScore ?? 1) - (a.contributionToScore ?? 1));

    const employeesText = filteredCandidates
      .map((c) => {
        const empSkillMap = new Map(c.employeeSkills.map((s) => [s.skillId, s]));
        const skills = c.employeeSkills
          .slice(0, 8)
          .map((es) => `${es.skillName}:${es.level.toUpperCase()}`)
          .join(', ');

        const buildFact = (req: any) => {
          const skillName = (req.skillId as any).name as string;
          const reqLevel = (req.level as string).toUpperCase();
          const emp = empSkillMap.get(String((req.skillId as any)._id))
            ?? [...empSkillMap.values()].find((s) => s.skillName.toUpperCase() === skillName.toUpperCase());
          if (!emp) return `${skillName}:NOT_IN_CV`;
          const empOrd = LEVEL_ORDINAL[emp.level.toUpperCase()] ?? 1;
          const reqOrd = LEVEL_ORDINAL[reqLevel] ?? 1;
          const gap = reqOrd - empOrd;
          const displayGap = Math.max(0, gap);
          return `${skillName}:emp=${emp.level.toUpperCase()},req=${reqLevel},gap=${displayGap}`;
        };

        const skillFacts = reqSkillsForPrompt.map(buildFact).join(', ');
        const approvedTag = approvedIds.has(String(c.employee._id)) ? ' [HR:APPROVED]' : '';

        return (
          `#${c.rank} | ID: ${c.employee._id} | ${fixEncoding(c.employee.name ?? '')}${approvedTag}` +
          ` | AlgoTotal:${c.totalScore.toFixed(1)}` +
          ` | skillMatch:${c.skillMatchScore.toFixed(1)}` +
          ` | progression:${c.progressionScore.toFixed(1)}` +
          ` | context:${c.contextScore.toFixed(1)}` +
          ` | Skills: ${skills || 'none'}` +
          ` | RequiredSkillStatus: ${skillFacts}`
        );
      })
      .join('\n');

    let hrFeedbackText: string;

    if (pastDecisions.length > 0) {
      hrFeedbackText = pastDecisions.map((d) => {
        const empId = String(d.employeeId);
        const candidate = top100.find((c) => String(c.employee._id) === empId);
        const name = candidate?.employee?.name ? fixEncoding(candidate.employee.name) : empId;
        const icon = d.decision === 'approved' ? '✓' : '✗';
        return `${icon} ${name} (ID: ${empId}) — ${d.decision.toUpperCase()} by HR (AI score was ${d.aiScore ?? '?'})`;
      }).join('\n');
    } else {
      // Fallback: find decisions from similar activities (same context + type)
      const actContext = (activity as any).context;
      const actType = (activity as any).type;

      const similarActivities = await this.activityModel
        .find({
          _id: { $ne: activityId },
          ...(actContext ? { context: actContext } : {}),
          ...(actType    ? { type: actType }       : {}),
        })
        .select('_id')
        .limit(5)
        .lean();

      const similarIds = similarActivities.map((a) => String(a._id));
      const similarDecisions = similarIds.length > 0
        ? await this.decisionModel.find({ activityId: { $in: similarIds } }).limit(10).lean()
        : [];

      if (similarDecisions.length > 0) {
        hrFeedbackText =
          `No decisions yet for this activity. Based on similar ${actContext ?? ''} ${actType ?? ''} activities:\n` +
          similarDecisions.map((d) => {
            const icon = d.decision === 'approved' ? '✓' : '✗';
            return `${icon} Employee ID: ${d.employeeId} — ${d.decision.toUpperCase()} (AI score was ${d.aiScore ?? '?'})`;
          }).join('\n');
      } else {
        hrFeedbackText = 'No previous HR decisions available. Rank based on scores only.';
      }
    }

    const prompt = template
      .replace(/\{\{top_k\}\}/g, String(top_k))
      .replace(/{{activity\.title}}/g,       (activity as any).title ?? '')
      .replace(/{{activity\.type}}/g,        (activity as any).type ?? '')
      .replace(/{{activity\.context}}/g,     (activity as any).context ?? '')
      .replace(/{{activity\.description}}/g, (activity as any).description ?? '')
      .replace(/{{activity\.skills}}/g,      activitySkillsText)
      .replace('{{employees}}',              employeesText)
      .replace('{{hr_feedback}}',            hrFeedbackText)
      .replace('{{primary_skill}}',          primarySkillName)
      .replace('{{required_skill_names}}',   requiredSkillNames)
      .replace('{{weight_skill}}',           Math.round(weights.skillMatch  * 100).toString())
      .replace('{{weight_progression}}',     Math.round(weights.progression * 100).toString())
      .replace('{{weight_context}}',         Math.round(weights.context     * 100).toString());

    // Call Ollama — fallback sur scoring algo si Ollama indisponible
    let parsed: any;
    try {
      const raw = await this.callOllama(prompt, `recommendation — activity: ${(activity as any).title}`, top_k);
      this.logger.log(`[LLM] Raw response (${raw.length} chars): ${raw.slice(0, 200)}…`);

      // Validation JSON : extraire le premier objet JSON valide si le LLM ajoute du texte parasite
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found in LLM response');
      parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed.rankings) || parsed.rankings.length === 0) {
        throw new Error(`Invalid rankings structure: ${JSON.stringify(parsed).slice(0, 100)}`);
      }

      // Filter out hallucinated IDs — keep only IDs that exist in filteredCandidates
      const validIds = new Set(filteredCandidates.map((c) => String(c.employee._id)));
      const seenIds = new Set<string>();
      const validRankings = parsed.rankings.filter((r: any) => {
        const id = String(r.employeeId);
        if (!validIds.has(id) || seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      });

      if (validRankings.length < parsed.rankings.length) {
        this.logger.warn(`[LLM] ${parsed.rankings.length - validRankings.length} invalid/duplicate ID(s) removed`);
      }

      // If LLM returned fewer valid rankings than top_k, fill with best remaining candidates
      if (validRankings.length < top_k) {
        const usedIds = new Set(validRankings.map((r: any) => String(r.employeeId)));
        const fallbacks = filteredCandidates
          .filter((c) => !usedIds.has(String(c.employee._id)))
          .slice(0, top_k - validRankings.length)
          .map((c) => ({
            employeeId: String(c.employee._id),
            score: Math.round(c.totalScore),
            reasons: [
              `Skill Match : ${c.skillMatchScore.toFixed(1)}/100`,
              `Progression : ${c.progressionScore.toFixed(1)}/100`,
              `Context     : ${c.contextScore.toFixed(1)}/100`,
            ],
          }));
        validRankings.push(...fallbacks);
      }

      parsed.rankings = validRankings;
      this.logger.log(`[LLM] Parsed ${parsed.rankings.length} rankings`);
    } catch (err: any) {
      this.logger.warn(`[Ollama] fallback algo — raison: ${err.message}`);
      parsed = {
        source: 'algo-fallback',
        rankings: candidates.slice(0, top_k).map((c) => ({
          employeeId: String(c.employee._id),
          score: Math.round(c.totalScore),
          reasons: [
            `Skill Match : ${c.skillMatchScore.toFixed(1)}/100`,
            `Progression : ${c.progressionScore.toFixed(1)}/100`,
            `Context     : ${c.contextScore.toFixed(1)}/100`,
          ],
        })),
      };
    }

    // Build a candidates snapshot (only ranked employees) to avoid re-calling /top100 on load
    const rankedIds = new Set((parsed.rankings ?? []).map((r: any) => String(r.employeeId)));
    const candidatesSnapshot = filteredCandidates
      .filter((c) => rankedIds.has(String(c.employee._id)))
      .map((c) => ({
        employeeId: String(c.employee._id),
        name: c.employee.name,
        email: c.employee.email,
        skillMatchScore: c.skillMatchScore,
        progressionScore: c.progressionScore,
        contextScore: c.contextScore,
        employeeSkills: c.employeeSkills,
      }));

    // Save to DB — chaque génération crée une nouvelle entrée (historique)
    const doc = await this.recoModel.create({
      activityId,
      jsonOllama: { ...parsed, elapsedMs: Date.now() - startGeneration, candidates: candidatesSnapshot },
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
    const historyEntry = {
      decision: body.decision,
      aiScore: body.aiScore,
      aiReasons: body.aiReasons ?? [],
      hrComment: body.hrComment,
      decidedAt: new Date(),
    };

    const doc = await this.decisionModel.findOneAndUpdate(
      { activityId, employeeId: body.employeeId },
      {
        $set: {
          decision: body.decision,
          aiScore: body.aiScore,
          aiReasons: body.aiReasons ?? [],
          hrComment: body.hrComment,
        },
        $push: { history: historyEntry },
      },
      { upsert: true, returnDocument: 'after' },
    );

    // Si approuvé → ajouter les required skills de l'activité au profil de l'employee
    if (body.decision === 'approved') {
      try {
        const activity = await this.activityModel
          .findById(activityId)
          .populate('requiredSkills.skillId')
          .lean();
        if (activity) {
          const skillIds = ((activity as any).requiredSkills ?? [])
            .filter((rs: any) => rs.skillId != null && typeof rs.skillId === 'object')
            .map((rs: any) => (rs.skillId as any)._id);

          if (skillIds.length > 0) {
            await this.userModel.findByIdAndUpdate(
              body.employeeId,
              { $addToSet: { skills: { $each: skillIds } } },
            );
            this.logger.log(`[Decision] Employee ${body.employeeId} approved — ${skillIds.length} skills added`);
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Decision] Failed to update employee skills: ${err.message}`);
      }
    }

    return doc;
  }

  async getDecisions(activityId: string): Promise<HrDecisionDocument[]> {
    return this.decisionModel.find({ activityId }).lean();
  }

  /** Retourne les activités où l'employee a été approuvé (pour la page profil) */
  async getApprovedActivitiesForEmployee(employeeId: string) {
    const decisions = await this.decisionModel
      .find({ employeeId, decision: 'approved' })
      .lean();

    const activityIds = decisions.map(d => d.activityId);
    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .populate('requiredSkills.skillId')
      .lean();

    return activities.map(a => {
      const dec = decisions.find(d => String(d.activityId) === String(a._id));
      return { ...a, aiScore: dec?.aiScore, aiReasons: dec?.aiReasons, decidedAt: dec?.history?.slice(-1)[0]?.decidedAt };
    });
  }

  // ── 6. Ollama streaming call ──────────────────────────────────────────────
  private readonly ollamaTimeoutMs = 10 * 60 * 1000; // 10 minutes max

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
      { responseType: 'stream', timeout: this.ollamaTimeoutMs },
    );

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        response.data.destroy();
        reject(new Error(`Ollama timeout after ${this.ollamaTimeoutMs / 1000}s`));
      }, this.ollamaTimeoutMs);
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
              clearTimeout(timer);
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
        clearTimeout(timer);
        this.logger.error(`[Ollama] stream error: ${err.message}`);
        appendLlmLog(`ERROR: ${err.message}\n`);
        reject(err);
      });
    });
  }
}
