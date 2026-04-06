import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HrDecisionDocument = HrDecision & Document;

@Schema({ timestamps: true })
export class HrDecision {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  @Prop({ enum: ['approved', 'rejected'], required: true })
  decision: string;

  @Prop({ type: Number })
  aiScore: number; // score donné par Ollama au moment de la décision

  @Prop({ type: [String], default: [] })
  aiReasons: string[]; // raisons données par Ollama

  @Prop({ type: String })
  hrComment?: string; // commentaire optionnel du RH
}

export const HrDecisionSchema = SchemaFactory.createForClass(HrDecision);

// Index pour éviter les doublons et accélérer les requêtes
HrDecisionSchema.index({ activityId: 1, employeeId: 1 }, { unique: true });
