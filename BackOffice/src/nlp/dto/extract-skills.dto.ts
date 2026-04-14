import { IsString } from 'class-validator';

export class ExtractSkillsDto {
  // Description from which skills need to be extracted
  @IsString()
  description: string;
}
