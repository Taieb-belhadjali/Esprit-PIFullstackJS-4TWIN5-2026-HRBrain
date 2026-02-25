import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ collection: 'departments', timestamps: true })
export class Department {

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  user_id: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);