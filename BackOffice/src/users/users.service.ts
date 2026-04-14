import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import { PDFParse } from 'pdf-parse';
import { User } from './shemas/user.shema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Skill } from '../skill/skill.schema';
import { Department } from '../department/department.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Skill.name)
    private skillModel: Model<Skill>,
    @InjectModel(Department.name)
    private departmentModel: Model<Department>,
  ) {}

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async detectSkillIdsFromText(text: string) {
    const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'];
    // Alias acceptés à la saisie → normalisés
    const levelAliases: Record<string, string> = { GOOD: 'HIGH' };

    const allSkills = await this.skillModel
      .find({}, { _id: 1, name: 1 })
      .lean();
    const skillMap = new Map(
      allSkills.map((s) => [s.name.toUpperCase(), String(s._id)]),
    );

    const lines = (text || '')
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new BadRequestException(
        'Fichier vide. Format: SKILL:LEVEL (ex: JAVA:HIGH)',
      );
    }

    const foundSkillIds = new Set<string>();
    const errors: string[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Accepte : lettres, chiffres, espaces, #, +, ., -, _, @ avant le ":"
      const match = line.match(/^([A-Za-z0-9\s#\+\.\-\_@]+):([A-Za-z]+)$/i);

      if (!match) {
        errors.push(
          `Ligne ${lineNumber}: Format invalide "${line}". Requis: SKILL:HIGH|MEDIUM|LOW|EXPERT`,
        );
        continue;
      }

      const skillName = match[1].trim().toUpperCase();
      let level = match[2].toUpperCase();

      // Normaliser les alias (ex: GOOD → HIGH)
      if (levelAliases[level]) level = levelAliases[level];

      if (!validLevels.includes(level)) {
        errors.push(
          `Ligne ${lineNumber}: Niveau invalide "${match[2]}". Accepté: HIGH, MEDIUM, LOW, EXPERT`,
        );
        continue;
      }

      let skillId = skillMap.get(skillName);
      if (!skillId) {
        try {
          const newSkill = await this.skillModel.create({ name: skillName });
          skillId = String(newSkill._id);
          skillMap.set(skillName, skillId);
        } catch (err) {
          errors.push(
            `Ligne ${lineNumber}: Erreur création skill "${skillName}"`,
          );
          continue;
        }
      }

      foundSkillIds.add(skillId);
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' | '));
    }

    if (foundSkillIds.size === 0) {
      throw new BadRequestException(
        'Aucun skill valide. Format: SKILL:HIGH|MEDIUM|LOW|EXPERT',
      );
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

  /** Génère un fichier CV .txt avec des skills aléatoires depuis la DB */
  private async generateCvFile(employeeId: string, employeeName: string): Promise<{ cvPath: string; skillIds: string[] }> {
    const LEVELS = [
      'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW',  // 41%
      'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM',   // 30%
      'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH',                                  // 21%
      'EXPERT', 'EXPERT',                                                       // 8%
    ];
    const CORE_SKILLS = [
      'NODE.JS', 'TYPESCRIPT', 'PYTHON', 'REACT', 'POSTGRESQL', 'MONGODB',
      'DOCKER', 'KUBERNETES', 'GIT', 'JAVASCRIPT', 'JAVA', 'SPRING BOOT',
    ];

    const randomLevel = () => LEVELS[Math.floor(Math.random() * LEVELS.length)];
    const shuffle = <T>(arr: T[]) => arr.sort(() => Math.random() - 0.5);

    // Charger tous les skills de la DB
    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const skillMap = new Map<string, { name: string; id: string }>();
    for (const s of allSkills) {
      const key = s.name.toUpperCase();
      if (!skillMap.has(key)) skillMap.set(key, { name: s.name, id: String(s._id) });
    }
    const skillNames = Array.from(skillMap.values()).map(v => v.name);

    // 5-12 skills aléatoires
    const count = 5 + Math.floor(Math.random() * 8);

    // 40% de chance d'inclure 1-2 core skills
    const coreToAdd: string[] = [];
    if (Math.random() < 0.4) {
      const validCores = CORE_SKILLS.filter((c) => skillMap.has(c));
      const numCore = 1 + Math.floor(Math.random() * 2);
      coreToAdd.push(...shuffle([...validCores]).slice(0, numCore));
    }

    const remaining = count - coreToAdd.length;
    const others = shuffle([...skillNames].filter((n) => !coreToAdd.includes(n.toUpperCase()))).slice(0, remaining);
    const chosen = [...coreToAdd.map((c) => skillMap.get(c)?.name ?? c), ...others];

    const lines = chosen.map((name) => `${name}:${randomLevel()}`);

    // Chemin du fichier : DataSets/uploads/<id>_<name>.txt
    const safeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    const uploadsDir = join(process.cwd(), 'DataSets', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    const filename = `${employeeId}_${safeName}.txt`;
    const absolutePath = join(uploadsDir, filename);
    await writeFile(absolutePath, lines.join('\n') + '\n', 'utf-8');

    // Récupérer les IDs des skills générés
    const skillIds: string[] = chosen
      .map(name => skillMap.get(name.toUpperCase())?.id)
      .filter((id): id is string => !!id);

    // Chemin relatif pour la DB (comme les autres employés du dataset)
    const relativeCvPath = join('DataSets', 'uploads', filename);
    return { cvPath: relativeCvPath, skillIds };
  }

  async create(data: CreateUserDto, file?: Express.Multer.File) {
    try {
      console.log('=== CREATE USER ===');
      console.log('Role:', data.role);
      console.log('File:', file ? { filename: file.filename, path: file.path, mimetype: file.mimetype } : 'NO FILE'); 
      const hashedPassword = await bcrypt.hash(data.password, 10);

      let cvDetectedSkillIds: string[] = [];
      let manualSkills: string[] = [];
      let finalCvPath: string | undefined;

      if (data.role === 'EMPLOYEE') {
        manualSkills = data.skills ? (Array.isArray(data.skills) ? data.skills : [data.skills]) : [];

        if (file?.path) {
          // CV fourni manuellement — extraire les skills
          let cvText = '';
          if (file.mimetype === 'application/pdf') {
            cvText = await this.extractTextFromPdf(file.path);
          } else if (file.mimetype === 'text/plain') {
            cvText = await this.extractTextFromTxt(file.path);
          }
          cvDetectedSkillIds = await this.detectSkillIdsFromText(cvText);
          finalCvPath = `uploads/${file.filename}`;

          // Ajouter les skills manuels non présents dans le CV
          const cvDetectedSet = new Set(cvDetectedSkillIds);
          const conflictSkills = manualSkills.filter(id => cvDetectedSet.has(id));
          if (conflictSkills.length > 0) {
            const details = await this.skillModel.find({ _id: { $in: conflictSkills } }, { name: 1 });
            throw new BadRequestException(`Skill déjà dans le CV: ${details.map(s => s.name).join(', ')}`);
          }
          const manualNotInCV = manualSkills.filter(id => !cvDetectedSet.has(id));
          if (manualNotInCV.length > 0) {
            const details = await this.skillModel.find({ _id: { $in: manualNotInCV } }, { name: 1 });
            let content = await readFile(file.path, 'utf-8');
            content += '\n' + details.map(s => `${s.name}:LOW`).join('\n');
            await writeFile(file.path, content, 'utf-8');
          }
          cvDetectedSkillIds = [...cvDetectedSkillIds, ...manualNotInCV];
        }
        // Pas de fichier fourni → générer un CV automatiquement (ID temporaire, on met à jour après save)
        // On génère d'abord l'utilisateur pour avoir son _id, puis on crée le fichier
      }

      const mergedSkillIds = data.role === 'EMPLOYEE'
        ? [...new Set([...manualSkills, ...cvDetectedSkillIds])]
          : [];

      const user = new this.userModel({
        ...data,
        password: hashedPassword,
        mustChangePassword: true,
        cv: finalCvPath,
        skills: mergedSkillIds,
        cvDetectedSkills: data.role === 'EMPLOYEE' ? cvDetectedSkillIds : [],
        departmentId: data.departmentId ?? null,
      });

      const savedUser = await user.save();

      // Si MANAGER avec departmentId → l'ajouter dans managerIds du département
      if (data.role === 'MANAGER' && data.departmentId) {
        await this.departmentModel.findByIdAndUpdate(
          data.departmentId,
          { $addToSet: { managerIds: new Types.ObjectId(String(savedUser._id)) } },
        );
      }

      // Génération auto du CV si aucun fichier fourni pour un EMPLOYEE
      if (data.role === 'EMPLOYEE' && !file?.path) {
        const { cvPath, skillIds } = await this.generateCvFile(
          String(savedUser._id),
          (data as any).name ?? 'employee',
        );
        await this.userModel.findByIdAndUpdate(savedUser._id, {
          cv: cvPath,
          skills: skillIds,
          cvDetectedSkills: skillIds,
        });
        console.log(`CV auto-généré: ${cvPath} avec ${skillIds.length} skills`);
      }

      // Ajouter l'employé au dataset CSV
      if (data.role === 'EMPLOYEE') {
        try {
          const updatedUser = await this.userModel.findById(savedUser._id).lean();
          const csvPath = join(process.cwd(), 'DataSets', 'employees_updated.csv');
          console.log(`CSV path: ${csvPath}`);
          const safeName = (updatedUser as any).name?.replace(/,/g, ' ') ?? '';
          const safeEmail = (updatedUser as any).email?.replace(/,/g, ' ') ?? '';
          const safeCv = ((updatedUser as any).cv ?? '').replace(/,/g, ' ');
          const csvLine = `\n${safeName},${safeEmail},${data.password},EMPLOYEE,${safeCv},true`;
          await writeFile(csvPath, csvLine, { flag: 'a', encoding: 'utf-8' });
          console.log(`Employé ajouté au CSV: ${safeName}`);
        } catch (err) {
          console.error('Erreur ajout CSV:', err);
        }
      }

      return (await this.userModel.findById(savedUser._id))!.populate('skills', 'name');
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Create user error:', error);
      throw new BadRequestException(error.message || 'Error creating user');
    }
  }

  async findAll() {
    return this.userModel.find().populate('skills', 'name').populate('departmentId', 'name');
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).populate('skills', 'name').populate('departmentId', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, data, {
      new: true,
    }).populate('skills', 'name').populate('departmentId', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted' };
  }
}
