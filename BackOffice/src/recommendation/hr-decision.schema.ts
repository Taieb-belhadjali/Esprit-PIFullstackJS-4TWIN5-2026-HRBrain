import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HrDecisionDocument = HrDecision & Document;

@Schema()
export class DecisionHistoryEntry {
  @Prop({ enum: ['approved', 'rejected'], required: true })
  decision: string;

  @Prop({ type: Number })
  aiScore?: number;

  @Prop({ type: [String], default: [] })
  aiReasons: string[];

  @Prop({ type: String })
  hrComment?: string;

  @Prop({ type: Date, default: () => new Date() })
  decidedAt: Date;
}

export const DecisionHistoryEntrySchema = SchemaFactory.createForClass(DecisionHistoryEntry);

@Schema({ timestamps: true })
export class HrDecision {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  /** Dernière décision active */
  @Prop({ enum: ['approved', 'rejected'], required: true })
  decision: string;

  @Prop({ type: Number })
  aiScore: number;

  @Prop({ type: [String], default: [] })
  aiReasons: string[];

  @Prop({ type: String })
  hrComment?: string;

  /** Historique complet des décisions successives */
  @Prop({ type: [DecisionHistoryEntrySchema], default: [] })
  history: DecisionHistoryEntry[];
}

export const HrDecisionSchema = SchemaFactory.createForClass(HrDecision);

HrDecisionSchema.index({ activityId: 1, employeeId: 1 }, { unique: true });
