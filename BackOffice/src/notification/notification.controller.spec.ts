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
    // Extracts userId from the JWT sub claim and returns notifications for that user only
    it('should return notifications for the logged-in user', async () => {
      const notifications = [mockNotification];
      mockNotifService.findByUser.mockResolvedValue(notifications);
      const result = await controller.findAll(mockReq);
      expect(result).toEqual(notifications);
      expect(service.findByUser).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    // Empty list is returned when the user has no notifications — no error thrown
    it('should return empty array when no notifications', async () => {
      mockNotifService.findByUser.mockResolvedValue([]);
      const result = await controller.findAll(mockReq);
      expect(result).toEqual([]);
    });
  });

  describe('unreadCount', () => {
    // Returns the unread count wrapped in { count } so the frontend badge can display it
    it('should return unread count', async () => {
      mockNotifService.countUnread.mockResolvedValue(5);
      const result = await controller.unreadCount(mockReq);
      expect(result).toEqual({ count: 5 });
      expect(service.countUnread).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    // Count of 0 is a valid state — the badge should be hidden, not an error
    it('should return 0 when no unread notifications', async () => {
      mockNotifService.countUnread.mockResolvedValue(0);
      const result = await controller.unreadCount(mockReq);
      expect(result).toEqual({ count: 0 });
    });
  });

  describe('markAllAsRead', () => {
    // Marks all of the authenticated user's notifications as read in a single operation
    it('should mark all notifications as read', async () => {
      mockNotifService.markAllAsRead.mockResolvedValue(undefined);
      await controller.markAllAsRead(mockReq);
      expect(service.markAllAsRead).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('markAsRead', () => {
    // Marks a single notification as read, scoped to the authenticated user to prevent cross-user modification
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
    // Deletes a single notification, scoped to the authenticated user to prevent cross-user deletion
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
