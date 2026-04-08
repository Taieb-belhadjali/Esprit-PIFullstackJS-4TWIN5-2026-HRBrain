import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { Activity, ActivityDocument } from './activity.schema';
import { CreateActivityDto } from './dto-activity/create-activity.dto';
import { UpdateActivityDto } from './dto-activity/update-activity.dto';
import { User } from '../users/shemas/user.shema';
import { Skill } from '../skill/skill.schema';
import { Department } from '../department/department.schema';
import {
  parseCvSkillLevels,
  calculateSkillMatchScore,
  calculateContextScore,
  calculateProgressionScore,
  calculateFinalScore,
  EmployeeSkillLevel,
  RequiredSkillInput,
} from './scoring.util';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Skill.name) private skillModel: Model<Skill>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
  ) {}

  async create(dto: CreateActivityDto): Promise<ActivityDocument> {
    return new this.activityModel(dto).save();
  }

  async findAll(departmentId?: string): Promise<ActivityDocument[]> {
    const filter: any = {};
    if (departmentId) filter.targetedDepartmentId = departmentId;
    return this.activityModel.find(filter).populate('requiredSkills.skillId').exec();
  }

  /** Retourne uniquement les activités des départements gérés par ce manager */
  async findAllForManager(managerId: string, departmentId?: string): Promise<ActivityDocument[]> {
    const departments = await this.departmentModel
      .find({ managerIds: new Types.ObjectId(managerId) }, { _id: 1 })
      .lean();
    const deptIds = departments.map((d) => d._id);

    const filter: any = { targetedDepartmentId: { $in: deptIds } };
    if (departmentId) filter.targetedDepartmentId = departmentId;

    return this.activityModel.find(filter).populate('requiredSkills.skillId').exec();
  }

  /** Retourne uniquement les activités du département de l'employee */
  async findAllForEmployee(employeeId: string): Promise<ActivityDocument[]> {
    const employee = await this.userModel.findById(employeeId, { departmentId: 1 }).lean();
    if (!employee || !(employee as any).departmentId) return [];
    return this.activityModel
      .find({ targetedDepartmentId: (employee as any).departmentId })
      .populate('requiredSkills.skillId')
      .exec();
  }
  async isManagerOfDepartment(managerId: string, departmentId?: string): Promise<boolean> {
    if (!departmentId) return false;
    const dept = await this.departmentModel.findOne({
      _id: new Types.ObjectId(departmentId),
      managerIds: new Types.ObjectId(managerId),
    });
    return !!dept;
  }

  async findOne(id: string): Promise<ActivityDocument> {
    const activity = await this.activityModel.findById(id).populate('requiredSkills.skillId').exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<ActivityDocument> {
    const updated = await this.activityModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException(`Activity ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<ActivityDocument> {
    const deleted = await this.activityModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Activity ${id} not found`);
    return deleted;
  }

  async getRecommendations(activityId: string, limit = 100) {
    // 1. Load activity with populated skills
    const activity = await this.activityModel
      .findById(activityId)
      .populate('requiredSkills.skillId')
      .exec();
    if (!activity) throw new NotFoundException(`Activity ${activityId} not found`);

    // 2. Build requiredSkills input list
    const requiredSkills: RequiredSkillInput[] = activity.requiredSkills.map((rs) => {
      const skill = rs.skillId as any;
      return {
        skillId: String(skill._id ?? skill),
        skillName: skill.name ?? '',
        level: rs.level,
        contributionToScore: rs.contributionToScore ?? 1,
      };
    });

    // 3. contextScore — identique pour tous les employés de cette activité
    const contextScore = calculateContextScore(activity.context ?? '');

    // 4. Build skill name -> id map for CV parsing
    const allSkills = await this.skillModel.find({}, { _id: 1, name: 1 }).lean();
    const skillNameMap = new Map<string, string>(
      allSkills.map((s) => [s.name.toUpperCase(), String(s._id)]),
    );

    // 5. Load only employees belonging to the activity's targeted department
    const employeeFilter: any = { role: 'EMPLOYEE' };
    if (activity.targetedDepartmentId) {
      employeeFilter.departmentId = activity.targetedDepartmentId;
    }

    const employees = await this.userModel
      .find(employeeFilter)
      .populate('skills', 'name')
      .lean();

    // 6. Score each employee
    const results: {
      employee: any;
      skillMatchScore: number;
      contextScore: number;
      progressionScore: number;
      finalScore: number;
      employeeSkills: EmployeeSkillLevel[];
    }[] = [];

    for (const emp of employees) {
      let employeeSkills: EmployeeSkillLevel[] = [];
      if (emp.cv) {
        try {
          const cvPath = emp.cv.startsWith('/') ? emp.cv : resolve(process.cwd(), emp.cv);
          if (existsSync(cvPath)) {
            const cvText = await readFile(cvPath, 'utf-8');
            employeeSkills = parseCvSkillLevels(cvText, skillNameMap);
          }
        } catch { /* skip if file unreadable */ }
      }

      if (employeeSkills.length === 0 && emp.skills?.length) {
        employeeSkills = (emp.skills as any[]).map((s) => ({
          skillId: String(s._id ?? s),
          skillName: s.name ?? '',
          level: 'LOW',
        }));
      }

      const skillMatch = calculateSkillMatchScore(employeeSkills, requiredSkills);
      const progression = calculateProgressionScore(employeeSkills, requiredSkills);
      const final = calculateFinalScore(skillMatch, progression, contextScore);

      results.push({
        employee: {
          _id: emp._id,
          name: (emp as any).name,
          email: (emp as any).email,
          skills: emp.skills,
          departmentId: (emp as any).departmentId,
        },
        skillMatchScore: skillMatch,
        contextScore: contextScore,
        progressionScore: progression,
        finalScore: final,
        employeeSkills,
      });
    }

    // 7. Sort by finalScore desc, return top N
    results.sort((a, b) => b.finalScore - a.finalScore);
    return results.slice(0, limit);
  }
}
