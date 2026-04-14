import { Body, Controller, Post } from '@nestjs/common';
import { NlpService } from './nlp.service';
import { ExtractSkillsDto } from './dto/extract-skills.dto';

@Controller('nlp')
export class NlpController {
  constructor(private readonly nlpService: NlpService) {}

  @Post('extract-skills')
  async extractSkills(@Body() dto: ExtractSkillsDto) {
    const skills = await this.nlpService.extractSkills(dto.description);
    return { skills };
  }
}