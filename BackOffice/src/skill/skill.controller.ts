import { Controller, Get, Post, Patch, Delete, Param, Body, Logger } from '@nestjs/common';
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
  findAll() {
    return this.skillService.findAll();
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