import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from '../skill/skill.schema';

@Injectable()
export class NlpService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async extractSkills(text: string): Promise<string[]> {
    if (!text) return [];

    const normalized = text.toLowerCase();
    const skills = await this.skillModel.find().lean().exec();

    const matched = skills.filter((skill) => {
      const name = skill.name.toLowerCase().trim();

      // Skip very short names — too many false positives
      if (name.length <= 2) return false;

      // Escape special regex chars in skill name
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Word boundary: not preceded or followed by alphanumeric chars
      const regex = new RegExp(`(?<![a-z0-9.])${escaped}(?![a-z0-9])`, 'i');
      return regex.test(normalized);
    });

    return [...new Set(matched.map((s) => s.name))];
  }
}
