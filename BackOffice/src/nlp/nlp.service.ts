import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from '../skill/skill.schema';

@Injectable()
export class NlpService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  /**
   * Extracts skill names from free text by matching against all skills in the DB.
   * Uses word-boundary regex to avoid false positives (e.g. "C" matching "CSS").
   *
   * @param text - Raw text to scan (CV content, job description, etc.)
   * @returns Deduplicated list of matched skill names
   */
  async extractSkills(text: string): Promise<string[]> {
    if (!text) return [];

    const normalized = text.toLowerCase();
    const skills = await this.skillModel.find().lean().exec();

    const matched = skills.filter((skill) => {
      const name = skill.name.toLowerCase().trim();

      // Skip very short names — too many false positives (e.g. "C", "R")
      if (name.length <= 2) return false;

      // Escape special regex characters in the skill name so they are treated as literals
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

      // Word boundary: not preceded or followed by alphanumeric chars
      const regex = new RegExp(`(?<![a-z0-9.])${escaped}(?![a-z0-9])`, 'i');
      return regex.test(normalized);
    });

    // Deduplicate and return original casing
    return [...new Set(matched.map((s) => s.name))];
  }
}
