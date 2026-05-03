import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from './department.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Department } from './department.schema';

describe('DepartmentService', () => {
  let service: DepartmentService;

  const mockDepartment = {
    _id: 'dept-1',
    name: 'Engineering',
    managerIds: [],
  };

  const mockDepartmentModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  // Constructor mock
  const mockModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(mockDepartment),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: getModelToken(Department.name),
          useValue: Object.assign(mockModelConstructor, mockDepartmentModel),
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
    jest.clearAllMocks();
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a department successfully', async () => {
      const dto = { name: 'Engineering', managerIds: [] };
      const result = await service.create(dto);
      expect(result).toEqual(mockDepartment);
    });

    it('should throw error when name is empty', async () => {
      await expect(service.create({ name: '', managerIds: [] })).rejects.toThrow(
        'Le nom du département ne peut pas être vide',
      );
    });

    it('should throw error when name is only whitespace', async () => {
      await expect(service.create({ name: '   ', managerIds: [] })).rejects.toThrow(
        'Le nom du département ne peut pas être vide',
      );
    });

    it('should trim the department name', async () => {
      const dto = { name: '  Engineering  ', managerIds: [] };
      await service.create(dto);
      expect(mockModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Engineering' }),
      );
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all departments', async () => {
      const departments = [mockDepartment];
      mockDepartmentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(departments),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(departments);
      expect(mockDepartmentModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no departments', async () => {
      mockDepartmentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a department by id', async () => {
      mockDepartmentModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDepartment),
        }),
      });

      const result = await service.findOne('dept-1');
      expect(result).toEqual(mockDepartment);
    });

    it('should throw NotFoundException when department not found', async () => {
      mockDepartmentModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByManager ──────────────────────────────────────────────────────────
  describe('findByManager', () => {
    it('should return departments managed by a user', async () => {
      const departments = [mockDepartment];
      mockDepartmentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(departments),
        }),
      });

      const result = await service.findByManager('507f1f77bcf86cd799439011');
      expect(result).toEqual(departments);
      expect(mockDepartmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a department successfully', async () => {
      const updatedDept = { ...mockDepartment, name: 'Updated Engineering' };
      mockDepartmentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedDept),
        }),
      });

      const result = await service.update('dept-1', { name: 'Updated Engineering' });
      expect(result).toEqual(updatedDept);
    });

    it('should throw NotFoundException when department not found', async () => {
      mockDepartmentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should trim name when updating', async () => {
      mockDepartmentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDepartment),
        }),
      });

      await service.update('dept-1', { name: '  Trimmed Name  ' });
      expect(mockDepartmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'dept-1',
        expect.objectContaining({ name: 'Trimmed Name' }),
        expect.any(Object),
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a department successfully', async () => {
      mockDepartmentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDepartment),
      });

      const result = await service.remove('dept-1');
      expect(result).toEqual(mockDepartment);
    });

    it('should throw NotFoundException when department not found', async () => {
      mockDepartmentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
