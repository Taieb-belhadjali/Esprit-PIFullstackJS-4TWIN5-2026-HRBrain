import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './department.schema';
import { CreateDepartmentDto } from './dto-department/create-department.dto';
import { UpdateDepartmentDto } from './dto-department/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<DepartmentDocument> {
    if (!createDepartmentDto.name?.trim()) {
      throw new Error('Le nom du département ne peut pas être vide');
    }
    const managerIds = (createDepartmentDto.managerIds ?? []).map(
      (id) => new Types.ObjectId(id),
    );
    const created = new this.departmentModel({
      name: createDepartmentDto.name.trim(),
      managerIds,
    });
    return created.save();
  }

  async findAll(): Promise<DepartmentDocument[]> {
    return this.departmentModel.find().populate('managerIds', 'name email').exec();
  }

  async findOne(id: string): Promise<DepartmentDocument> {
    const doc = await this.departmentModel.findById(id).populate('managerIds', 'name email').exec();
    if (!doc) {
      throw new NotFoundException(`Département avec id ${id} non trouvé`);
    }
    return doc;
  }

  /** Retourne tous les départements dont le manager fait partie */
  async findByManager(managerId: string): Promise<DepartmentDocument[]> {
    return this.departmentModel
      .find({ managerIds: new Types.ObjectId(managerId) })
      .populate('managerIds', 'name email')
      .exec();
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<DepartmentDocument> {
    const payload: Record<string, any> = {};
    if (updateDepartmentDto.name !== undefined) {
      payload.name = updateDepartmentDto.name.trim();
    }
    if (updateDepartmentDto.managerIds !== undefined) {
      payload.managerIds = updateDepartmentDto.managerIds.map(
        (mid) => new Types.ObjectId(mid),
      );
    }
    const updated = await this.departmentModel
      .findByIdAndUpdate(id, payload, { new: true })
      .populate('managerIds', 'name email')
      .exec();
    if (!updated) {
      throw new NotFoundException(`Département avec id ${id} non trouvé`);
    }
    return updated;
  }

  async remove(id: string): Promise<DepartmentDocument> {
    const deleted = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Département avec id ${id} non trouvé`);
    }
    return deleted;
  }
}
