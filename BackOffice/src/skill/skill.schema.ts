// src/skill/schemas/skill.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Type pour Mongoose + NestJS
export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string; // optionnel
}

// Schema Mongoose pour la collection "skills"
export const SkillSchema = SchemaFactory.createForClass(Skill);