import { Module } from '@nestjs/common';
import { NlpService } from './nlp.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NlpController } from './nlp.controller';
import { Skill, SkillSchema } from 'src/skill/skill.schema';

@Module({
  providers: [NlpService],
  controllers: [NlpController],
  imports: [MongooseModule.forFeature([{ name: Skill.name, schema: SkillSchema }])],
})
export class NlpModule {}
