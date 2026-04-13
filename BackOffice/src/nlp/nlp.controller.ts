import { Body, Controller, Post } from '@nestjs/common';
import { NlpService } from './nlp.service';
import { ExtractSkillsDto } from './dto/extract-skills.dto';

// NLP Controller to handle natural language processing related requests
@Controller('nlp')
export class NlpController {
  constructor(private readonly nlpService: NlpService) {}
  // Endpoint to extract skills from a given description
  @Post('extract-skills')
  async extractSkills(@Body() dto: ExtractSkillsDto) {
    const skills = await this.nlpService.extractSkills(dto.description);
    return { skills };
  }
}
