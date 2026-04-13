import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { readFile, writeFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { User } from './shemas/user.shema';
import { CreateUserDto, SUPPORTED_LANGUAGES } from './dto/create-user.dto';
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
    const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'];
    // Alias acceptés à la saisie → normalisés
    const levelAliases: Record<string, string> = { GOOD: 'HIGH' };

    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const skillMap = new Map(
      allSkills.map(s => [s.name.toUpperCase(), String(s._id)])
    );

    const lines = (text || '')
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new BadRequestException('Fichier vide. Format: SKILL:LEVEL (ex: JAVA:HIGH)');
    }

    const foundSkillIds = new Set<string>();
    const errors: string[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Accepte : lettres, chiffres, espaces, #, +, ., -, _, @ avant le ":"
      const match = line.match(/^([A-Za-z0-9\s#\+\.\-\_@]+):([A-Za-z]+)$/i);

      if (!match) {
        errors.push(`Ligne ${lineNumber}: Format invalide "${line}". Requis: SKILL:HIGH|MEDIUM|LOW|EXPERT`);
        continue;
      }

      const skillName = match[1].trim().toUpperCase();
      let level = match[2].toUpperCase();

      // Normaliser les alias (ex: GOOD → HIGH)
      if (levelAliases[level]) level = levelAliases[level];

      if (!validLevels.includes(level)) {
        errors.push(`Ligne ${lineNumber}: Niveau invalide "${match[2]}". Accepté: HIGH, MEDIUM, LOW, EXPERT`);
        continue;
      }

      let skillId = skillMap.get(skillName);
      if (!skillId) {
        try {
          const newSkill = await this.skillModel.create({ name: skillName });
          skillId = String(newSkill._id);
          skillMap.set(skillName, skillId);
        } catch (err) {
          errors.push(`Ligne ${lineNumber}: Erreur création skill "${skillName}"`);
          continue;
        }
      }

      foundSkillIds.add(skillId);
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' | '));
    }

    if (foundSkillIds.size === 0) {
      throw new BadRequestException('Aucun skill valide. Format: SKILL:HIGH|MEDIUM|LOW|EXPERT');
    }

    return Array.from(foundSkillIds);
  }

  private async extractTextFromPdf(filePath: string) {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text || '';
  }

  private async extractTextFromTxt(filePath: string) {
    const buffer = await readFile(filePath);
    return buffer.toString('utf-8');
  }

  async create(data: CreateUserDto, file?: Express.Multer.File) {
    try {
      console.log('=== CREATE USER ===');
      console.log('Role:', data.role);
      console.log('File:', file ? { filename: file.filename, path: file.path, mimetype: file.mimetype } : 'NO FILE');
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Extract skills from file only for EMPLOYEE role
      let cvDetectedSkillIds: string[] = [];
      let manualSkills: string[] = [];
      
      if (data.role === 'EMPLOYEE') {
        // Extract skills from file if provided (PDF or TXT)
        if (file?.path) {
          console.log('Extracting skills from file:', file.path);
          let cvText = '';
          
          if (file.mimetype === 'application/pdf') {
            cvText = await this.extractTextFromPdf(file.path);
          } else if (file.mimetype === 'text/plain') {
            cvText = await this.extractTextFromTxt(file.path);
          }
          
          // Detecter les skills - cela jettera une erreur si format invalide
          cvDetectedSkillIds = await this.detectSkillIdsFromText(cvText);
          console.log('Detected skills:', cvDetectedSkillIds);
        } else {
          console.log('NO FILE PROVIDED for EMPLOYEE');
        }

        // Récupérer les skills sélectionnés manuellement
        manualSkills = data.skills ? (Array.isArray(data.skills) ? data.skills : [data.skills]) : [];
        console.log('Manual skills:', manualSkills);
        const cvDetectedSet = new Set(cvDetectedSkillIds);
        
        // Vérifier les doublons (skills déjà dans le CV)
        const conflictSkills = manualSkills.filter(skillId => cvDetectedSet.has(skillId));

        if (conflictSkills.length > 0) {
          const conflictSkillDetails = await this.skillModel.find(
            { _id: { $in: conflictSkills } },
            { name: 1 }
          );
          throw new BadRequestException(
            `Skill déjà dans le CV: ${conflictSkillDetails.map(s => s.name).join(', ')}`
          );
        }

        // Ajouter les skills manuels qui ne sont pas dans le CV avec niveau LOW
        const manualNotInCV = manualSkills.filter(skillId => !cvDetectedSet.has(skillId));
        
        // Si skills manuels ajoutés, les ajouter au fichier texte
        if (manualNotInCV.length > 0 && file?.path) {
          try {
            // Récupérer les détails des skills manuels
            const manualSkillDetails = await this.skillModel.find(
              { _id: { $in: manualNotInCV } },
              { name: 1 }
            );
            
            // Lire le fichier existant
            let fileContent = await readFile(file.path, 'utf-8');
            
            // Ajouter les nouveaux skills avec niveau LOW
            const newSkillsText = manualSkillDetails
              .map(skill => `${skill.name}:LOW`)
              .join('\n');
            
            fileContent = fileContent + '\n' + newSkillsText;
            
            // Écrire le fichier modifié
            await writeFile(file.path, fileContent, 'utf-8');
            
            console.log(`Skills manuels ajoutés au fichier: ${manualSkillDetails.map(s => s.name).join(', ')}`);
          } catch (err) {
            console.error('Erreur lors de la mise à jour du fichier:', err);
          }
        }
        
        cvDetectedSkillIds = [...cvDetectedSkillIds, ...manualNotInCV];
      }

      // Merge manual skills + CV-detected skills (only for EMPLOYEE)
      const mergedSkillIds = data.role === 'EMPLOYEE' 
        ? [...new Set([...manualSkills, ...cvDetectedSkillIds])]
        : [];

      const cvPath = file && data.role === 'EMPLOYEE' ? `uploads/${file.filename}` : undefined;
      console.log('CV Path to save:', cvPath);

      const user = new this.userModel({
        ...data,
        password: hashedPassword,
        mustChangePassword: true,
        cv: cvPath,
        skills: mergedSkillIds,
        cvDetectedSkills: data.role === 'EMPLOYEE' ? cvDetectedSkillIds : [],
      });

      const savedUser = await user.save();
      console.log('User saved:', { id: savedUser._id, cv: savedUser.cv });
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
    console.log('UsersService.update called with:', id, data);
    const user = await this.userModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    }).populate('skills', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted' };
  }

  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES.map(lang => ({ code: lang }));
  }
}
