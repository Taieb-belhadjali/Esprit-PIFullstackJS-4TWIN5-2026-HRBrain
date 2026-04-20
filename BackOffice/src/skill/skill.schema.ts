
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true, minlength: 1, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  // Référence vers la collection departments
  @Prop({ type: Types.ObjectId, ref: 'Department', required: false })
  departmentId?: Types.ObjectId;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);

// ── Performance indexes ────────────────────────────────────────────────────
// name: used in detectSkillIdsFromText() — find({}, { _id, name }) + skillMap lookup
// sparse: true because name is required but we want case-insensitive lookups
SkillSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
// departmentId: used to filter skills by department
SkillSchema.index({ departmentId: 1 });