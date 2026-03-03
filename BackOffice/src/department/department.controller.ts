import { Controller, Get, Post, Body, Param, Put, Delete, Options } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { Department } from './schemas/department.schema';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Options('*')
  options() {
    return { status: 'ok' };
  }

  @Get()
  findAll() {
    return this.departmentService.findAll();
  }

  @Post()
  create(@Body() department: Partial<Department>) {
    return this.departmentService.create(department);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() department: Partial<Department>) {
    return this.departmentService.update(id, department);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}