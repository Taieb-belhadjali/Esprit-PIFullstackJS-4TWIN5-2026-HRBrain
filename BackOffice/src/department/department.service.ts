import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  // GET all
  async findAll(): Promise<Department[]> {
    return this.departmentModel.find().exec();
  }

  // CREATE
  async create(department: Partial<Department>): Promise<Department> {
    const newDepartment = new this.departmentModel(department);
    return newDepartment.save();
  }

  // UPDATE
  async update(id: string, department: Partial<Department>): Promise<Department> {
    const updated = await this.departmentModel.findByIdAndUpdate(id, department, { new: true });
    if (!updated) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.departmentModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    return { message: 'Department deleted successfully' };
  }

}