import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from './skill.schema';
import { CreateSkillDto } from './dto-skill/create-skill.dto';
import { UpdateSkillDto } from './dto-skill/update-skill.dto';

@Injectable()
export class SkillService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<SkillDocument> {
    if (!createSkillDto.name || !createSkillDto.name.trim()) {
      throw new Error('Le nom du skill ne peut pas être vide');
    }
    const createdSkill = new this.skillModel(createSkillDto);
    return createdSkill.save();
  }

  // Retourne tous les skills, filtrés par département si fourni
  async findAll(departmentId?: string): Promise<SkillDocument[]> {
    const filter: any = {};
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    return this.skillModel.find(filter).exec();
  }

  async findOne(id: string): Promise<SkillDocument> {
    const skill = await this.skillModel.findById(id).exec();
    if (!skill) {
      throw new NotFoundException(`Skill avec id ${id} non trouvé`);
    }
    return skill;
  }

  // Met à jour un skill (PATCH partiel)
  async update(
    id: string,
    updateSkillDto: UpdateSkillDto,
  ): Promise<SkillDocument> {
    const updatedSkill = await this.skillModel
      .findByIdAndUpdate(id, updateSkillDto, { returnDocument: 'after' })
      .exec();

    if (!updatedSkill) {
      throw new NotFoundException(`Skill avec id ${id} non trouvé`);
    }
    return updatedSkill;
  }

  async remove(id: string): Promise<SkillDocument> {
    const deletedSkill = await this.skillModel.findByIdAndDelete(id).exec();
    if (!deletedSkill) {
      throw new NotFoundException(`Skill avec id ${id} non trouvé`);
    }
    return deletedSkill;
  }
}