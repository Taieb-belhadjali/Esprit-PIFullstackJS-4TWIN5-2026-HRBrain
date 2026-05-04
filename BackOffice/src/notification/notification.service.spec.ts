import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from './notification.schema';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotification = {
    _id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    title: 'Test Notification',
    message: 'Test message',
    type: 'info',
    category: 'System',
    read: false,
    createdAt: new Date(),
  };

  const mockNotifModel = {
    create: jest.fn(),
    insertMany: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotifModel,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a notification successfully', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      const result = await service.create({
        userId: '507f1f77bcf86cd799439012',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        category: 'System',
      })

      expect(result).toEqual(mockNotification)
      expect(mockNotifModel.create).toHaveBeenCalledTimes(1)
    })

    it('should convert string userId to ObjectId', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      await service.create({
        userId: '507f1f77bcf86cd799439012',
        title: 'Test',
        message: 'Test',
        type: 'info',
        category: 'System',
      })

      expect(mockNotifModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Object), // ObjectId
        }),
      )
    })

    it('should create notification with optional link', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      await service.create({
        userId: '507f1f77bcf86cd799439012',
        title: 'Test',
        message: 'Test',
        type: 'success',
        category: 'Activity',
        link: '/dashboard/activities',
      })

      expect(mockNotifModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ link: '/dashboard/activities' }),
      )
    })
  })

  // ── createForMany ──────────────────────────────────────────────────────────
  describe('createForMany', () => {
    it('should create notifications for multiple users', async () => {
      mockNotifModel.insertMany.mockResolvedValue([])

      await service.createForMany(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'], {
        title: 'Test',
        message: 'Test message',
        type: 'info',
        category: 'System',
      })

      expect(mockNotifModel.insertMany).toHaveBeenCalledTimes(1)
      const insertedDocs = mockNotifModel.insertMany.mock.calls[0][0]
      expect(insertedDocs).toHaveLength(2)
    })

    it('should not call insertMany when userIds is empty', async () => {
      await service.createForMany([], {
        title: 'Test',
        message: 'Test',
        type: 'info',
        category: 'System',
      })

      expect(mockNotifModel.insertMany).not.toHaveBeenCalled()
    })
  })

  describe('findByUser', () => {
    it('should return notifications for a user', async () => {
      const notifications = [mockNotification]
      mockNotifModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(notifications),
          }),
        }),
      })

      const result = await service.findByUser('507f1f77bcf86cd799439012')
      expect(result).toEqual(notifications)
    })

    it('should sort by createdAt descending', async () => {
      const sortMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      })
      mockNotifModel.find.mockReturnValue({ sort: sortMock })

      await service.findByUser('507f1f77bcf86cd799439012')
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 })
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockNotifModel.updateOne.mockResolvedValue({ modifiedCount: 1 })

      await service.markAsRead('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')

      expect(mockNotifModel.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: '507f1f77bcf86cd799439011' }),
        { $set: { read: true } },
      )
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      mockNotifModel.updateMany.mockResolvedValue({ modifiedCount: 5 })

      await service.markAllAsRead('507f1f77bcf86cd799439012')

      expect(mockNotifModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ read: false }),
        { $set: { read: true } },
      )
    })
  })

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockNotifModel.deleteOne.mockResolvedValue({ deletedCount: 1 })

      await service.delete('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')

      expect(mockNotifModel.deleteOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: '507f1f77bcf86cd799439011' }),
      )
    })
  })

  describe('countUnread', () => {
    it('should return count of unread notifications', async () => {
      mockNotifModel.countDocuments.mockResolvedValue(3)

      const result = await service.countUnread('507f1f77bcf86cd799439012')
      expect(result).toBe(3)
    })

    it('should return 0 when no unread notifications', async () => {
      mockNotifModel.countDocuments.mockResolvedValue(0)

      const result = await service.countUnread('507f1f77bcf86cd799439012')
      expect(result).toBe(0)
    })
  })

  describe('notifyRecommendationReady', () => {
    it('should create notification for manager', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      await service.notifyRecommendationReady('507f1f77bcf86cd799439012', 'React Training', 5)

      expect(mockNotifModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Recommandation IA prête',
          type: 'success',
          category: 'Recommendation',
        }),
      )
    })

    it('should use singular form for 1 candidate', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      await service.notifyRecommendationReady('507f1f77bcf86cd799439012', 'Training', 1)

      const callArg = mockNotifModel.create.mock.calls[0][0]
      expect(callArg.message).toContain('1 candidat classé')
    })

    it('should use plural form for multiple candidates', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      await service.notifyRecommendationReady('507f1f77bcf86cd799439012', 'Training', 3)

      const callArg = mockNotifModel.create.mock.calls[0][0]
      expect(callArg.message).toContain('3 candidats classés')
    })
  })

  describe('notifyEmployeeApproved', () => {
    it('should create notification for employee', async () => {
      mockNotifModel.create.mockResolvedValue(mockNotification)

      await service.notifyEmployeeApproved('507f1f77bcf86cd799439012', 'React Training')

      expect(mockNotifModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Vous avez été sélectionné !',
          type: 'success',
          category: 'Activity',
        }),
      )
    })
  })

  describe('notifyNewActivityInDepartment', () => {
    it('should notify all employees in department', async () => {
      mockNotifModel.insertMany.mockResolvedValue([])

      await service.notifyNewActivityInDepartment(
        ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        'React Training',
        'Engineering',
      )

      expect(mockNotifModel.insertMany).toHaveBeenCalledTimes(1)
      const docs = mockNotifModel.insertMany.mock.calls[0][0]
      expect(docs).toHaveLength(2)
    })
  })

  describe('notifyNewEmployeeInDepartment', () => {
    it('should notify all managers in department', async () => {
      mockNotifModel.insertMany.mockResolvedValue([])

      await service.notifyNewEmployeeInDepartment(
        ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        'John Doe',
        'Engineering',
      )

      expect(mockNotifModel.insertMany).toHaveBeenCalledTimes(1)
      const docs = mockNotifModel.insertMany.mock.calls[0][0]
      expect(docs).toHaveLength(2)
    })
  })
})
