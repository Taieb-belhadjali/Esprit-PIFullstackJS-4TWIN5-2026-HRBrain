import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, IsMongoId, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RequiredSkillDto {
  @IsMongoId()
  skillId: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumber()
  contributionToScore?: number;
}

export class CreateActivityDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsMongoId()
  createdById?: string;

  @IsOptional()
  @IsNumber()
  maxRecommandation?: number;

  @IsOptional()
  @IsMongoId()
  targetedDepartmentId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredSkillDto)
  requiredSkills?: RequiredSkillDto[];
}
