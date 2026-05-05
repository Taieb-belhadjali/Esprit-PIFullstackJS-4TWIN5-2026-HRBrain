import { Controller, Get, Post, Patch, Delete, Param, Body, Logger, Query, Header, UseGuards } from '@nestjs/common';
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto-skill/create-skill.dto';
import { UpdateSkillDto } from './dto-skill/update-skill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('skills')
export class SkillController {
  private readonly logger = new Logger(SkillController.name);

  constructor(private readonly skillService: SkillService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HR')
  async create(@Body() createSkillDto: CreateSkillDto) {
    try {
      this.logger.log(`Creating skill with data: ${JSON.stringify(createSkillDto)}`);
      return await this.skillService.create(createSkillDto);
    } catch (error) {
      this.logger.error(`Error creating skill: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  findAll(@Query('departmentId') departmentId?: string) {
    return this.skillService.findAll(departmentId);
  }

  @Get('count')
  count(@Query('departmentId') departmentId?: string) {
    return this.skillService.count(departmentId).then((count) => ({ count }));
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  findOne(@Param('id') id: string) {
    return this.skillService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HR')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillService.update(id, updateSkillDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HR')
  remove(@Param('id') id: string) {
    return this.skillService.remove(id);
  }
}