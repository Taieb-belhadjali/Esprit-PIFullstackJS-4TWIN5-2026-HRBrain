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

    const text = description.toLowerCase();

    const skills = await this.skillModel.find().exec();

    const matchedSkills = skills.filter((skill) =>
      text.includes(skill.name.toLowerCase())
    );

    // remove duplicates
    return [...new Set(matchedSkills.map(s => s.name))];
  }
}