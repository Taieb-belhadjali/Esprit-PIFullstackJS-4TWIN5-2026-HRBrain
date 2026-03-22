import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { User } from './shemas/user.shema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Skill } from '../skill/skill.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Skill.name)
    private skillModel: Model<Skill>,
  ) {}

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async detectSkillIdsFromText(text: string) {
      // 1. Récupérer tous les skills de la base

    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const normalizedText = (text || '').toLowerCase();
// 2. Pour chaque skill, chercher son nom dans le texte du CV
    return allSkills
      .filter((skill) => {
        const name = (skill.name || '').trim().toLowerCase();
        if (!name) return false;
        const pattern = new RegExp(`\\b${this.escapeRegex(name)}\\b`, 'i');
        return pattern.test(normalizedText);
      })
      .map((skill) => String(skill._id));
  }

  private async extractTextFromPdf(filePath: string) {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text || '';
  }

  async create(data: CreateUserDto, file?: Express.Multer.File) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Extract skills from PDF if file is provided
      let cvDetectedSkillIds: string[] = [];
      if (file?.path) {
        try {
          const cvText = await this.extractTextFromPdf(file.path);
          cvDetectedSkillIds = await this.detectSkillIdsFromText(cvText);
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          cvDetectedSkillIds = [];
        }
      }

      // Check if manually selected skills conflict with CV-detected skills
      const manualSkills = data.skills ? (Array.isArray(data.skills) ? data.skills : [data.skills]) : [];
      const cvDetectedSet = new Set(cvDetectedSkillIds);
      const conflictSkills = manualSkills.filter(skillId => cvDetectedSet.has(skillId));

      if (conflictSkills.length > 0) {
        const conflictSkillDetails = await this.skillModel.find(
          { _id: { $in: conflictSkills } },
          { name: 1 }
        );
        throw new BadRequestException(
          `Skill déjà détecté dans le CV: ${conflictSkillDetails.map(s => s.name).join(', ')}`
        );
      }

      // Merge manual skills + CV-detected skills
      const mergedSkillIds = [...new Set([...manualSkills, ...cvDetectedSkillIds])];

      const user = new this.userModel({
        ...data,
        password: hashedPassword,
        mustChangePassword: true,
        cv: file ? `uploads/${file.filename}` : undefined,
        skills: mergedSkillIds,
        cvDetectedSkills: cvDetectedSkillIds,
      });

      const savedUser = await user.save();
      return savedUser.populate('skills', 'name');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Create user error:', error);
      throw new BadRequestException(error.message || 'Error creating user');
    }
  }

  async findAll() {
    return this.userModel.find().populate('skills', 'name');
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).populate('skills', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, data, {
      new: true,
    }).populate('skills', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted' };
  }
}
