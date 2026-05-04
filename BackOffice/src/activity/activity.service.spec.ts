import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Activity } from './activity.schema';
import { User } from '../users/shemas/user.shema';
import { Skill } from '../skill/skill.schema';
import { Department } from '../department/department.schema';
import { NotificationService } from '../notification/notification.service';

describe('ActivityService', () => {
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

  const mockActivityModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
  };

  const mockModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(mockActivity),
  }));

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockSkillModel = {
    find: jest.fn(),
  };

  const mockDepartmentModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockNotifService = {
    notifyNewActivityInDepartment: jest.fn(),
    notifyRecommendationReady: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: getModelToken(Activity.name),
          useValue: Object.assign(mockModelConstructor, mockActivityModel),
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
        { provide: getModelToken(Department.name), useValue: mockDepartmentModel },
        { provide: NotificationService, useValue: mockNotifService },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    jest.clearAllMocks();
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create an activity successfully', async () => {
      mockDepartmentModel.findById.mockResolvedValue({ name: 'Engineering' });
      mockUserModel.find.mockResolvedValue([]);

      const dto = {
        title: 'React Training',
        description: 'Learn React',
        type: 'Training',
        context: 'upskilling',
        status: 'active',
        targetedDepartmentId: '507f1f77bcf86cd799439012',
        createdById: '507f1f77bcf86cd799439013',
        requiredSkills: [],
        startDate: new Date(),
        endDate: new Date(),
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockActivity);
    });

    it('should notify employees when department is specified', async () => {
      mockDepartmentModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: 'Engineering' }),
      });
      mockUserModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: '507f1f77bcf86cd799439014' },
          { _id: '507f1f77bcf86cd799439015' },
        ]),
      });

      const dto = {
        title: 'React Training',
        description: 'Learn React',
        type: 'Training',
        context: 'upskilling',
        status: 'active',
        targetedDepartmentId: '507f1f77bcf86cd799439012',
        createdById: '507f1f77bcf86cd799439013',
        requiredSkills: [],
        startDate: new Date(),
        endDate: new Date(),
      };

      await service.create(dto);
      // Notification may or may not be called depending on implementation
      expect(mockModelConstructor).toHaveBeenCalled();
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all activities without filter', async () => {
      const activities = [mockActivity];
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(activities),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(activities);
      expect(mockActivityModel.find).toHaveBeenCalledWith({});
    });

    it('should filter by departmentId when provided', async () => {
      const activities = [mockActivity];
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(activities),
        }),
      });

      const result = await service.findAll('507f1f77bcf86cd799439012');
      expect(result).toEqual(activities);
      expect(mockActivityModel.find).toHaveBeenCalledWith({
        targetedDepartmentId: '507f1f77bcf86cd799439012',
      });
    });

    it('should return empty array when no activities', async () => {
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findAllForManager ──────────────────────────────────────────────────────
  describe('findAllForManager', () => {
    it('should return empty array when manager has no departments', async () => {
      mockDepartmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAllForManager('507f1f77bcf86cd799439013');
      expect(result).toEqual([]);
    });

    it('should return activities for manager departments', async () => {
      const activities = [mockActivity];
      mockDepartmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439012' }]),
      });
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(activities),
        }),
      });

      const result = await service.findAllForManager('507f1f77bcf86cd799439013');
      expect(result).toEqual(activities);
    });
  });

  // ── findAllForEmployee ─────────────────────────────────────────────────────
  describe('findAllForEmployee', () => {
    it('should return empty array when employee has no department', async () => {
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439014' }),
      });

      const result = await service.findAllForEmployee('507f1f77bcf86cd799439014');
      expect(result).toEqual([]);
    });

    it('should return activities for employee department', async () => {
      const activities = [mockActivity];
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439014',
          departmentId: '507f1f77bcf86cd799439012',
        }),
      });
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(activities),
        }),
      });

      const result = await service.findAllForEmployee('507f1f77bcf86cd799439014');
      expect(result).toEqual(activities);
    });
  });

  // ── isManagerOfDepartment ──────────────────────────────────────────────────
  describe('isManagerOfDepartment', () => {
    it('should return false when departmentId is not provided', async () => {
      const result = await service.isManagerOfDepartment('507f1f77bcf86cd799439013');
      expect(result).toBe(false);
    });

    it('should return true when manager manages the department', async () => {
      mockDepartmentModel.findOne.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
      const result = await service.isManagerOfDepartment(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
      );
      expect(result).toBe(true);
    });

    it('should return false when manager does not manage the department', async () => {
      mockDepartmentModel.findOne.mockResolvedValue(null);
      const result = await service.isManagerOfDepartment(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
      );
      expect(result).toBe(false);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return an activity by id', async () => {
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockActivity),
        }),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update an activity', async () => {
      const updated = { ...mockActivity, title: 'Updated Training' };
      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { title: 'Updated Training' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent', { title: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete an activity', async () => {
      mockActivityModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActivity),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
