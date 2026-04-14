import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationCategory } from './notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
  ) {}

  /** Crée une notification pour un utilisateur */
  async create(payload: {
    userId: string | Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
    link?: string;
  }): Promise<NotificationDocument> {
    return this.notifModel.create({
      ...payload,
      userId: typeof payload.userId === 'string' ? new Types.ObjectId(payload.userId) : payload.userId,
    });
  }

  /** Crée la même notification pour plusieurs utilisateurs */
  async createForMany(
    userIds: (string | Types.ObjectId)[],
    payload: Omit<Parameters<NotificationService['create']>[0], 'userId'>,
  ): Promise<void> {
    if (userIds.length === 0) return;
    await this.notifModel.insertMany(
      userIds.map((userId) => ({
        ...payload,
        userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
      })),
    );
  }

  /** Retourne toutes les notifications d'un utilisateur (triées par date desc) */
  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notifModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  /** Marque une notification comme lue */
  async markAsRead(notifId: string, userId: string): Promise<void> {
    await this.notifModel.updateOne(
      { _id: notifId, userId: new Types.ObjectId(userId) },
      { $set: { read: true } },
    );
  }

  /** Marque toutes les notifications d'un user comme lues */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
  }

  /** Supprime une notification */
  async delete(notifId: string, userId: string): Promise<void> {
    await this.notifModel.deleteOne({
      _id: notifId,
      userId: new Types.ObjectId(userId),
    });
  }

  /** Compte les non-lues */
  async countUnread(userId: string): Promise<number> {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  // ── 4 scénarios ──────────────────────────────────────────────────────────

  /**
   * Scénario 1 — Recommandation générée
   * Notifie le manager créateur de l'activité
   */
  async notifyRecommendationReady(
    managerId: string,
    activityTitle: string,
    candidateCount: number,
    activityId: string,
  ): Promise<void> {
    await this.create({
      userId: managerId,
      title: 'Recommandation IA prête',
      message: `La recommandation pour "${activityTitle}" est prête — ${candidateCount} candidat${candidateCount > 1 ? 's' : ''} classé${candidateCount > 1 ? 's' : ''}.`,
      type: 'success',
      category: 'Recommendation',
      link: `/dashboard/activities`,
    });
  }

  /**
   * Scénario 2 — Employé approuvé
   * Notifie l'employé sélectionné
   */
  async notifyEmployeeApproved(
    employeeId: string,
    activityTitle: string,
    activityId: string,
  ): Promise<void> {
    await this.create({
      userId: employeeId,
      title: 'Vous avez été sélectionné !',
      message: `Félicitations ! Vous avez été sélectionné pour l'activité "${activityTitle}".`,
      type: 'success',
      category: 'Activity',
      link: `/dashboard/activities`,
    });
  }

  /**
   * Scénario 3 — Nouvelle activité dans le département
   * Notifie tous les employés du département ciblé
   */
  async notifyNewActivityInDepartment(
    employeeIds: string[],
    activityTitle: string,
    departmentName: string,
    activityId: string,
  ): Promise<void> {
    await this.createForMany(employeeIds, {
      title: 'Nouvelle activité disponible',
      message: `Une nouvelle activité "${activityTitle}" est disponible dans votre département ${departmentName}.`,
      type: 'info',
      category: 'Activity',
      link: `/dashboard/activities`,
    });
  }

  /**
   * Scénario 4 — Nouvel employé dans le département
   * Notifie le(s) manager(s) du département
   */
  async notifyNewEmployeeInDepartment(
    managerIds: string[],
    employeeName: string,
    departmentName: string,
  ): Promise<void> {
    await this.createForMany(managerIds, {
      title: 'Nouvel employé dans votre département',
      message: `"${employeeName}" a rejoint votre département ${departmentName}.`,
      type: 'info',
      category: 'System',
    });
  }
}
