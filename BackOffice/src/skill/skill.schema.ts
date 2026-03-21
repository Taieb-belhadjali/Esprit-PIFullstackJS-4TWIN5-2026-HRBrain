// src/skill/schemas/skill.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Type pour Mongoose + NestJS
export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true, minlength: 1, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string; // optionnel
}

// Schema Mongoose pour la collection "skills"
export const SkillSchema = SchemaFactory.createForClass(Skill);