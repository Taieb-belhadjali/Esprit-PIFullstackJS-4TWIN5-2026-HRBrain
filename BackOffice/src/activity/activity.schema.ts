import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ _id: false })
export class RequiredSkill {
  @Prop({ type: Types.ObjectId, ref: 'Skill', required: true })
  skillId: Types.ObjectId;

  @Prop({ trim: true, default: 'Medium' })
  level: string;

  @Prop({ default: 1, min: 1 })
  contributionToScore: number;
}

export const RequiredSkillSchema = SchemaFactory.createForClass(RequiredSkill);

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  type?: string;

  @Prop({ trim: true })
  context?: string;

  @Prop({ default: 'Draft' })
  status: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdById?: Types.ObjectId;

  @Prop({ default: 0 })
  nombreDePlaces: number;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: false })
  targetedDepartmentId?: Types.ObjectId;

  @Prop({ type: [RequiredSkillSchema], default: [] })
  requiredSkills: RequiredSkill[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
