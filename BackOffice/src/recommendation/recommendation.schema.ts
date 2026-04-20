import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecommendationDocument = Recommendation & Document;

@Schema({ timestamps: true })
export class Recommendation {
  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  jsonOllama: Record<string, any>; // JSON brut retourné par Ollama
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);

// ── Performance indexes ────────────────────────────────────────────────────
// activityId: used in findByActivity() and findAllByActivity()
RecommendationSchema.index({ activityId: 1 });
// activityId + createdAt: covers the sort({ createdAt: -1 }) in findByActivity
RecommendationSchema.index({ activityId: 1, createdAt: -1 });
