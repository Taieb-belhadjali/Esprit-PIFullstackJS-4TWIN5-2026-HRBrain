import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from './shemas/user.shema';
import { Skill } from '../skill/skill.schema';
import { Department } from '../department/department.schema';
import { NotificationService } from '../notification/notification.service';

jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: 'EMPLOYEE',
    skills: [],
    departmentId: '507f1f77bcf86cd799439012',
  };

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(mockUser),
  }));

  const mockSkillModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockDepartmentModel = {
    findById: jest.fn(),
  };

  const mockNotifService = {
    notifyNewEmployeeInDepartment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: Object.assign(mockModelConstructor, mockUserModel),
        },
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
        { provide: getModelToken(Department.name), useValue: mockDepartmentModel },
        { provide: NotificationService, useValue: mockNotifService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(users),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(mockUserModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no users', async () => {
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow('User not found');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedUser),
        }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'Jane Doe' });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should call findByIdAndUpdate with new: true', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      await service.update('507f1f77bcf86cd799439011', { name: 'Test' });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { name: 'Test' },
        { new: true },
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a non-employee user successfully', async () => {
      const hrUser = { ...mockUser, role: 'HR' };
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(hrUser),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ message: 'User deleted' });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
