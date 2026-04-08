import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: ['SUPERADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE' })
  role: string;

  @Prop()
  cv?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }], default: [] })
  skills: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }], default: [] })
  cvDetectedSkills: Types.ObjectId[];

  @Prop({ default: true })
  mustChangePassword: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
