import {IsString } from 'class-validator';

export class ExtractSkillsDto {
    @IsString()
    description: string;
}