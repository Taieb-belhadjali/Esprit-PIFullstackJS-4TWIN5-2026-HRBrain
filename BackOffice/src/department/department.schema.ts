import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ collection: 'departments', timestamps: true })
export class Department {
  @Prop({ required: true, unique: true, trim: true, minlength: 1 })
  name: string;

  /** IDs des managers responsables de ce département */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  managerIds: Types.ObjectId[];
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
