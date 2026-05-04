import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotification = {
    _id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    title: 'Test',
    message: 'Test message',
    type: 'info',
    category: 'System',
    read: false,
  };

  const mockNotifService = {
    findByUser: jest.fn(),
    countUnread: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
    delete: jest.fn(),
  };

  const mockReq = { user: { sub: '507f1f77bcf86cd799439012' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: mockNotifService }],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return notifications for the logged-in user', async () => {
      const notifications = [mockNotification];
      mockNotifService.findByUser.mockResolvedValue(notifications);
      const result = await controller.findAll(mockReq);
      expect(result).toEqual(notifications);
      expect(service.findByUser).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    it('should return empty array when no notifications', async () => {
      mockNotifService.findByUser.mockResolvedValue([]);
      const result = await controller.findAll(mockReq);
      expect(result).toEqual([]);
    });
  });

  describe('unreadCount', () => {
    it('should return unread count', async () => {
      mockNotifService.countUnread.mockResolvedValue(5);
      const result = await controller.unreadCount(mockReq);
      expect(result).toEqual({ count: 5 });
      expect(service.countUnread).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    it('should return 0 when no unread notifications', async () => {
      mockNotifService.countUnread.mockResolvedValue(0);
      const result = await controller.unreadCount(mockReq);
      expect(result).toEqual({ count: 0 });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotifService.markAllAsRead.mockResolvedValue(undefined);
      await controller.markAllAsRead(mockReq);
      expect(service.markAllAsRead).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockNotifService.markAsRead.mockResolvedValue(undefined);
      await controller.markAsRead('507f1f77bcf86cd799439011', mockReq);
      expect(service.markAsRead).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockNotifService.delete.mockResolvedValue(undefined);
      await controller.delete('507f1f77bcf86cd799439011', mockReq);
      expect(service.delete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
    });
  });
});
