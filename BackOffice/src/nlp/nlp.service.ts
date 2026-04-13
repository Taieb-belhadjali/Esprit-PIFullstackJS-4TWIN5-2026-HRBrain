import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from '../skill/skill.schema';

@Injectable()
export class NlpService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async extractSkills(description: string): Promise<string[]> {
    if (!description) return [];
    // Convert the description to lowercase for case-insensitive matching
    const text = description.toLowerCase();
    // Fetch all skills from the database
    const skills = await this.skillModel.find().exec();
    // Match skills in the description
    const matchedSkills = skills.filter((skill) =>
      text.includes(skill.name.toLowerCase()),
    );

    // remove duplicates
    return [...new Set(matchedSkills.map((s) => s.name))];
  }
}
