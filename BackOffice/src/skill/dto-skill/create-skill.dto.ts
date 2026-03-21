import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @IsNotEmpty({ message: 'Le nom du skill est obligatoire' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string; 
}