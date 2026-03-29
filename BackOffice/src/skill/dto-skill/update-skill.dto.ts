import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillDto } from './create-skill.dto';
import { IsMongoId, IsOptional } from 'class-validator';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {
	@IsOptional()
	@IsMongoId({ message: 'departmentId doit être un ObjectId valide' })
	departmentId?: string;
}