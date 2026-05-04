import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: ActivityService;

  const mockActivity = {
    _id: '507f1f77bcf86cd799439011',
    title: 'React Training',
    description: 'Learn React',
    type: 'Training',
    context: 'upskilling',
    status: 'active',
    targetedDepartmentId: '507f1f77bcf86cd799439012',
    createdById: '507f1f77bcf86cd799439013',
    requiredSkills: [],
  };

  const mockActivityService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllForManager: jest.fn(),
    findAllForEmployee: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getRecommendations: jest.fn(),
    isManagerOfDepartment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [{ provide: ActivityService, useValue: mockActivityService }],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    service = module.get<ActivityService>(ActivityService);
    jest.clearAllMocks();
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create activity for SUPERADMIN without department check', async () => {
      mockActivityService.create.mockResolvedValue(mockActivity);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'SUPERADMIN' } };
      const dto: any = {
        title: 'React Training',
        targetedDepartmentId: '507f1f77bcf86cd799439012',
      };

      const result = await controller.create(dto, req);
      expect(result).toEqual(mockActivity);
      expect(service.isManagerOfDepartment).not.toHaveBeenCalled();
    });

    it('should create activity for MANAGER who owns the department', async () => {
      mockActivityService.isManagerOfDepartment.mockResolvedValue(true);
      mockActivityService.create.mockResolvedValue(mockActivity);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'MANAGER' } };
      const dto: any = {
        title: 'React Training',
        targetedDepartmentId: '507f1f77bcf86cd799439012',
      };

      const result = await controller.create(dto, req);
      expect(result).toEqual(mockActivity);
      expect(service.isManagerOfDepartment).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
      );
    });

    it('should throw ForbiddenException when MANAGER does not own department', async () => {
      mockActivityService.isManagerOfDepartment.mockResolvedValue(false);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'MANAGER' } };
      const dto: any = {
        title: 'React Training',
        targetedDepartmentId: '507f1f77bcf86cd799439012',
      };

      await expect(controller.create(dto, req)).rejects.toThrow(ForbiddenException);
    });

    it('should inject createdById from token', async () => {
      mockActivityService.isManagerOfDepartment.mockResolvedValue(true);
      mockActivityService.create.mockResolvedValue(mockActivity);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'MANAGER' } };
      const dto: any = { title: 'React Training', targetedDepartmentId: '507f1f77bcf86cd799439012' };

      await controller.create(dto, req);
      expect(dto.createdById).toBe('507f1f77bcf86cd799439013');
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should call findAllForManager when user is MANAGER', async () => {
      const activities = [mockActivity];
      mockActivityService.findAllForManager.mockResolvedValue(activities);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'MANAGER' } };

      const result = await controller.findAll(undefined, req);
      expect(result).toEqual(activities);
      expect(service.findAllForManager).toHaveBeenCalledWith('507f1f77bcf86cd799439013', undefined);
    });

    it('should call findAllForEmployee when user is EMPLOYEE', async () => {
      const activities = [mockActivity];
      mockActivityService.findAllForEmployee.mockResolvedValue(activities);
      const req = { user: { sub: '507f1f77bcf86cd799439014', role: 'EMPLOYEE' } };

      const result = await controller.findAll(undefined, req);
      expect(result).toEqual(activities);
      expect(service.findAllForEmployee).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
    });

    it('should call findAll for other roles', async () => {
      const activities = [mockActivity];
      mockActivityService.findAll.mockResolvedValue(activities);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'HR' } };

      const result = await controller.findAll(undefined, req);
      expect(result).toEqual(activities);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass departmentId filter to findAllForManager', async () => {
      mockActivityService.findAllForManager.mockResolvedValue([]);
      const req = { user: { sub: '507f1f77bcf86cd799439013', role: 'MANAGER' } };

      await controller.findAll('507f1f77bcf86cd799439012', req);
      expect(service.findAllForManager).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
      );
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return an activity by id', async () => {
      mockActivityService.findOne.mockResolvedValue(mockActivity);
      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update an activity', async () => {
      const updated = { ...mockActivity, title: 'Updated Training' };
      mockActivityService.update.mockResolvedValue(updated);
      const result = await controller.update('507f1f77bcf86cd799439011', { title: 'Updated Training' });
      expect(result).toEqual(updated);
    });
  });

  // ── getRecommendations ─────────────────────────────────────────────────────
  describe('getRecommendations', () => {
    it('should return recommendations for an activity', async () => {
      const recommendations = [{ employeeId: '507f1f77bcf86cd799439014', score: 90 }];
      mockActivityService.getRecommendations.mockResolvedValue(recommendations);
      const result = await controller.getRecommendations('507f1f77bcf86cd799439011');
      expect(result).toEqual(recommendations);
      expect(service.getRecommendations).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete an activity', async () => {
      mockActivityService.remove.mockResolvedValue(mockActivity);
      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
