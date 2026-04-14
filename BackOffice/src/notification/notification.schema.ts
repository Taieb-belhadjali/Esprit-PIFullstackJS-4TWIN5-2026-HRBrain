import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export type NotificationType = 'success' | 'info' | 'warning' | 'alert';
export type NotificationCategory = 'Recommendation' | 'Activity' | 'System';

@Schema({ timestamps: true })
export class Notification {
  /** Destinataire */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: ['success', 'info', 'warning', 'alert'], default: 'info' })
  type: NotificationType;

  @Prop({ enum: ['Recommendation', 'Activity', 'System'], default: 'System' })
  category: NotificationCategory;

  @Prop({ default: false })
  read: boolean;

  /** Lien optionnel vers la ressource concernée */
  @Prop({ required: false })
  link?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
