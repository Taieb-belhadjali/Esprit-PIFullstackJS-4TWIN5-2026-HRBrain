import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { PDFParse } from 'pdf-parse';
import { User } from './shemas/user.shema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Skill } from '../skill/skill.schema';
import { Department } from '../department/department.schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)       private userModel: Model<User>,
    @InjectModel(Skill.name)      private skillModel: Model<Skill>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    private readonly notifService: NotificationService,
  ) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Parses a CV text file and returns the IDs of matched skills.
   *
   * Expected format (one skill per line):  SKILL_NAME:LEVEL
   * Example:  JAVA:HIGH  /  React:MEDIUM  /  Docker:LOW
   *
   * - Unknown skills are auto-created in the DB.
   * - Duplicate skill IDs are deduplicated via a Set.
   * - Throws BadRequestException if any line has an invalid format.
   */
  private async detectSkillIdsFromText(text: string): Promise<string[]> {
    const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'];
    // Accepted aliases normalised to canonical level names
    const levelAliases: Record<string, string> = { GOOD: 'HIGH' };

    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const skillMap = new Map(allSkills.map((s) => [s.name.toUpperCase(), String(s._id)]));

    const lines = (text || '')
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new BadRequestException('Fichier vide. Format: SKILL:LEVEL (ex: JAVA:HIGH)');
    }

    const foundSkillIds = new Set<string>();
    const errors: string[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Accept: letters, digits, spaces, #, +, ., -, _, @ before the colon
      const match = line.match(/^([A-Za-z0-9\s#+.\-_@]+):([A-Za-z]+)$/i);
      if (!match) {
        errors.push(`Ligne ${lineNumber}: Format invalide "${line}". Requis: SKILL:HIGH|MEDIUM|LOW|EXPERT`);
        continue;
      }

      const skillName = match[1].trim().toUpperCase();
      let level = match[2].toUpperCase();

      // Normalise aliases (e.g. GOOD → HIGH)
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
        } catch {
          errors.push(`Ligne ${lineNumber}: Erreur création skill "${skillName}"`);
          continue;
        }
      }

      foundSkillIds.add(skillId);
    }

    if (errors.length > 0) throw new BadRequestException(errors.join(' | '));
    if (foundSkillIds.size === 0) {
      throw new BadRequestException('Aucun skill valide. Format: SKILL:HIGH|MEDIUM|LOW|EXPERT');
    }

    return Array.from(foundSkillIds);
  }

  /** Extracts plain text from a PDF file using pdf-parse */
  private async extractTextFromPdf(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text || '';
  }

  /** Reads a plain-text file and returns its content as a UTF-8 string */
  private async extractTextFromTxt(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return buffer.toString('utf-8');
  }

  /**
   * Auto-generates a CV text file for a new employee when no file is uploaded.
   *
   * Picks 5–12 random skills from the DB with a realistic level distribution:
   *   LOW ~41% | MEDIUM ~30% | HIGH ~21% | EXPERT ~8%
   *
   * The file is saved to DataSets/uploads/<id>_<name>.txt
   *
   * @returns The relative CV path (for DB storage) and the list of skill IDs
   */
  private async generateCvFile(
    employeeId: string,
    employeeName: string,
  ): Promise<{ cvPath: string; skillIds: string[] }> {
    // Level distribution weighted to reflect realistic skill profiles
    const LEVELS = [
      'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW',
      'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM',
      'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH',
      'EXPERT', 'EXPERT',
    ];
    const CORE_SKILLS = [
      'NODE.JS', 'TYPESCRIPT', 'PYTHON', 'REACT', 'POSTGRESQL', 'MONGODB',
      'DOCKER', 'KUBERNETES', 'GIT', 'JAVASCRIPT', 'JAVA', 'SPRING BOOT',
    ];

    const randomLevel = () => LEVELS[Math.floor(Math.random() * LEVELS.length)];
    const shuffle = <T>(arr: T[]) => arr.sort(() => Math.random() - 0.5);

    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const skillMap = new Map<string, { name: string; id: string }>();
    for (const s of allSkills) {
      const key = s.name.toUpperCase();
      if (!skillMap.has(key)) skillMap.set(key, { name: s.name, id: String(s._id) });
    }
    const skillNames = Array.from(skillMap.values()).map((v) => v.name);

    const count = 5 + Math.floor(Math.random() * 8);

    // 40% chance to include 1–2 core skills for more realistic profiles
    const coreToAdd: string[] = [];
    if (Math.random() < 0.4) {
      const validCores = CORE_SKILLS.filter((c) => skillMap.has(c));
      const numCore = 1 + Math.floor(Math.random() * 2);
      coreToAdd.push(...shuffle([...validCores]).slice(0, numCore));
    }

    const remaining = count - coreToAdd.length;
    const others = shuffle(
      [...skillNames].filter((n) => !coreToAdd.includes(n.toUpperCase())),
    ).slice(0, remaining);

    const chosen = [
      ...coreToAdd.map((c) => skillMap.get(c)?.name ?? c),
      ...others,
    ];

    const lines = chosen.map((name) => `${name}:${randomLevel()}`);

    // Save to DataSets/uploads/<id>_<name>.txt
    const safeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    const uploadsDir = join(process.cwd(), 'DataSets', 'uploads');
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

    const filename = `${employeeId}_${safeName}.txt`;
    const absolutePath = join(uploadsDir, filename);
    await writeFile(absolutePath, lines.join('\n') + '\n', 'utf-8');

    const skillIds: string[] = chosen
      .map((name) => skillMap.get(name.toUpperCase())?.id)
      .filter((id): id is string => !!id);

    // Store relative path in DB (consistent with manually uploaded CVs)
    const relativeCvPath = join('DataSets', 'uploads', filename);
    return { cvPath: relativeCvPath, skillIds };
  }

  // ── Public CRUD methods ────────────────────────────────────────────────────

  /**
   * Creates a new user (HR, Manager, or Employee).
   *
   * For EMPLOYEE role:
   *  - If a CV file is provided: extracts skills from it, merges with manually selected skills.
   *  - If no CV file: auto-generates a CV with random skills.
   *  - Notifies department managers after creation.
   *  - Appends a row to the employees CSV dataset.
   *
   * For MANAGER role:
   *  - Adds the manager to the department's managerIds list.
   */
  async create(data: CreateUserDto, file?: Express.Multer.File) {
    try {
      this.logger.log(`Creating user — role: ${data.role}`);

      const hashedPassword = await bcrypt.hash(data.password, 10);

      let cvDetectedSkillIds: string[] = [];
      let manualSkills: string[] = [];
      let finalCvPath: string | undefined;

      if (data.role === 'EMPLOYEE') {
        manualSkills = data.skills
          ? Array.isArray(data.skills) ? data.skills : [data.skills]
          : [];

        if (file?.path) {
          // CV uploaded manually — extract skills from file content
          let cvText = '';
          if (file.mimetype === 'application/pdf') {
            cvText = await this.extractTextFromPdf(file.path);
          } else if (file.mimetype === 'text/plain') {
            cvText = await this.extractTextFromTxt(file.path);
          }
          cvDetectedSkillIds = await this.detectSkillIdsFromText(cvText);
          finalCvPath = `uploads/${file.filename}`;

          // Reject if a manually selected skill is already in the CV (duplicate)
          const cvDetectedSet = new Set(cvDetectedSkillIds);
          const conflictSkills = manualSkills.filter((id) => cvDetectedSet.has(id));
          if (conflictSkills.length > 0) {
            const details = await this.skillModel.find({ _id: { $in: conflictSkills } }, { name: 1 });
            throw new BadRequestException(`Skill déjà dans le CV: ${details.map((s) => s.name).join(', ')}`);
          }

          // Append manual skills not in CV as LOW-level entries
          const manualNotInCV = manualSkills.filter((id) => !cvDetectedSet.has(id));
          if (manualNotInCV.length > 0) {
            const details = await this.skillModel.find({ _id: { $in: manualNotInCV } }, { name: 1 });
            let content = await readFile(file.path, 'utf-8');
            content += '\n' + details.map((s) => `${s.name}:LOW`).join('\n');
            await writeFile(file.path, content, 'utf-8');
          }
          cvDetectedSkillIds = [...cvDetectedSkillIds, ...manualNotInCV];
        }
        // No file → CV will be auto-generated after the user is saved (we need the _id first)
      }

      // Merge manual + CV-detected skills (deduplicated)
      const mergedSkillIds =
        data.role === 'EMPLOYEE'
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

      // Add manager to department's managerIds list
      if (data.role === 'MANAGER' && data.departmentId) {
        await this.departmentModel.findByIdAndUpdate(data.departmentId, {
          $addToSet: { managerIds: new Types.ObjectId(String(savedUser._id)) },
        });
      }

      // Auto-generate CV for employees who didn't upload one
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
        this.logger.log(`Auto-generated CV: ${cvPath} (${skillIds.length} skills)`);
      }

      // Notify department managers when a new employee joins
      if (data.role === 'EMPLOYEE' && data.departmentId) {
        try {
          const dept = await this.departmentModel.findById(data.departmentId).lean();
          if (dept && (dept as any).managerIds?.length > 0) {
            const managerIds = (dept as any).managerIds.map((id: any) => String(id));
            await this.notifService.notifyNewEmployeeInDepartment(
              managerIds,
              (data as any).name ?? 'Nouvel employé',
              (dept as any).name ?? '',
            );
          }
        } catch { /* notification failure is non-blocking */ }
      }

      // Append employee to the CSV dataset (used for ML/analytics)
      if (data.role === 'EMPLOYEE') {
        try {
          const updatedUser = await this.userModel.findById(savedUser._id).lean();
          const csvPath = join(process.cwd(), 'DataSets', 'employees_updated.csv');
          const safeName  = (updatedUser as any).name?.replace(/,/g, ' ') ?? '';
          const safeEmail = (updatedUser as any).email?.replace(/,/g, ' ') ?? '';
          const safeCv    = ((updatedUser as any).cv ?? '').replace(/,/g, ' ');
          const csvLine   = `\n${safeName},${safeEmail},${data.password},EMPLOYEE,${safeCv},true`;
          await writeFile(csvPath, csvLine, { flag: 'a', encoding: 'utf-8' });
          this.logger.log(`Employee appended to CSV dataset: ${safeName}`);
        } catch (err) {
          // CSV update failure must not block user creation
          this.logger.warn(`CSV dataset update failed: ${(err as Error).message}`);
        }
      }

      return (await this.userModel.findById(savedUser._id))!.populate('skills', 'name');
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Create user failed: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException((error as Error).message || 'Error creating user');
    }
  }

  /** Returns all users with populated skills and department */
  async findAll() {
    return this.userModel
      .find()
      .populate('skills', 'name')
      .populate('departmentId', 'name');
  }

  /** Returns a single user by ID. Throws 404 if not found */
  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('skills', 'name')
      .populate('departmentId', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Updates a user's fields. Throws 404 if not found */
  async update(id: string, data: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('skills', 'name')
      .populate('departmentId', 'name');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Deletes a user by ID.
   * If the user is an EMPLOYEE, also removes their row from the CSV dataset.
   */
  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).lean();
    if (!user) throw new NotFoundException('User not found');

    if ((user as any).role === 'EMPLOYEE') {
      try {
        const csvPath = join(process.cwd(), 'DataSets', 'employees_updated.csv');
        const email   = (user as any).email ?? '';
        const content = await readFile(csvPath, 'utf-8');
        const filtered = content.split('\n').filter((line) => !line.includes(email));
        await writeFile(csvPath, filtered.join('\n'), 'utf-8');
        this.logger.log(`Employee removed from CSV dataset: ${email}`);
      } catch (err) {
        this.logger.warn(`CSV dataset cleanup failed: ${(err as Error).message}`);
      }
    }

    return { message: 'User deleted' };
  }
}
