import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './department.schema';
import { CreateDepartmentDto } from './dto-department/create-department.dto';
import { UpdateDepartmentDto } from './dto-department/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentDocument> {
    if (!createDepartmentDto.name?.trim()) {
      throw new Error('Le nom du département ne peut pas être vide');
    }
    if (!createDepartmentDto.user_id?.trim()) {
      throw new Error('Le user_id du manager ne peut pas être vide');
    }
    const created = new this.departmentModel({
      name: createDepartmentDto.name.trim(),
      user_id: createDepartmentDto.user_id.trim(),
    });
    return created.save();
  }

  async findAll(): Promise<DepartmentDocument[]> {
    return this.departmentModel.find().exec();
  }

  async findOne(id: string): Promise<DepartmentDocument> {
    const doc = await this.departmentModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Département avec id ${id} non trouvé`);
    }
    return doc;
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentDocument> {
    const payload: Record<string, string> = {};
    if (updateDepartmentDto.name !== undefined) {
      payload.name = updateDepartmentDto.name.trim();
    }
    if (updateDepartmentDto.user_id !== undefined) {
      payload.user_id = updateDepartmentDto.user_id.trim();
    }
    const updated = await this.departmentModel
      .findByIdAndUpdate(id, payload, { new: true })
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
