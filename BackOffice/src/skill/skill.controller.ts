// Contrôleur REST des skills : expose les routes GET, POST, PATCH, DELETE
import { Controller, Get, Post, Patch, Delete, Param, Body, Logger, Query } from '@nestjs/common';
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto-skill/create-skill.dto';
import { UpdateSkillDto } from './dto-skill/update-skill.dto';

@Controller('skills')
export class SkillController {
  private readonly logger = new Logger(SkillController.name);

  constructor(private readonly skillService: SkillService) {}

  @Post()
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
  findAll(@Query('departmentId') departmentId?: string) {
    return this.skillService.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillService.update(id, updateSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillService.remove(id);
  }
}