import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'Le nom du département est obligatoire' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: "L'identifiant du manager (user_id) est obligatoire" })
  @IsString()
  user_id: string;
}
