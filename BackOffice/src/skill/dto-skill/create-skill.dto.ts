// DTO création : valide name (requis), description (optionnel), departmentId (ObjectId requis)
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsMongoId } from 'class-validator';

export class CreateSkillDto {
  @IsNotEmpty({ message: 'Le nom du skill est obligatoire' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string; 

  @IsNotEmpty({ message: 'Le département est obligatoire' })
  @IsMongoId({ message: 'departmentId doit être un ObjectId valide' })
  departmentId: string;
}