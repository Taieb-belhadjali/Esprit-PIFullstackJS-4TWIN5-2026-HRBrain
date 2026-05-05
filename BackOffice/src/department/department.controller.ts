import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Logger,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto-department/create-department.dto';
import { UpdateDepartmentDto } from './dto-department/update-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('departments')
export class DepartmentController {
  private readonly logger = new Logger(DepartmentController.name);

  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    try {
      this.logger.log(`Creating department: ${JSON.stringify(createDepartmentDto)}`);
      return await this.departmentService.create(createDepartmentDto);
    } catch (error) {
      this.logger.error(`Error creating department: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  findAll() {
    return this.departmentService.findAll();
  }

  /** Retourne les départements gérés par le manager connecté */
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  findMine(@Request() req: any) {
    return this.departmentService.findByManager(req.user.sub);
  }

  /** Retourne les départements d'un manager spécifique (HR/SUPERADMIN) */
  @Get('manager/:managerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  findByManager(@Param('managerId') managerId: string) {
    return this.departmentService.findByManager(managerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
