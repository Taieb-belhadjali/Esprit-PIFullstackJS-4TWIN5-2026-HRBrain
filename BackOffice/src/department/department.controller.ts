import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto-department/create-department.dto';
import { UpdateDepartmentDto } from './dto-department/update-department.dto';

@Controller('departments')
export class DepartmentController {
  private readonly logger = new Logger(DepartmentController.name);

  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    try {
      this.logger.log(
        `Creating department: ${JSON.stringify(createDepartmentDto)}`,
      );
      return await this.departmentService.create(createDepartmentDto);
    } catch (error) {
      this.logger.error(`Error creating department: ${error.message}`);
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
