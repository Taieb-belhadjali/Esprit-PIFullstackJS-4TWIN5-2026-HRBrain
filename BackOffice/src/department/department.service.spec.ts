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
    // Cas nominal : le département est sauvegardé en base et le document est retourné
    it('should create a department successfully', async () => {
      const dto = { name: 'Engineering', managerIds: [] };
      const result = await service.create(dto);
      expect(result).toEqual(mockDepartment);
    });

    // An empty name string must be rejected before hitting the DB — clear error message for the caller
    it('should throw error when name is empty', async () => {
      await expect(service.create({ name: '', managerIds: [] })).rejects.toThrow(
        'Le nom du département ne peut pas être vide',
      );
    });

    // A whitespace-only name is semantically empty and must also be rejected
    it('should throw error when name is only whitespace', async () => {
      await expect(service.create({ name: '   ', managerIds: [] })).rejects.toThrow(
        'Le nom du département ne peut pas être vide',
      );
    });

    // Leading and trailing whitespace is stripped before saving to avoid display inconsistencies
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
    // Returns all departments with their populated manager references
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

    // Empty collection returns an empty array — no error thrown
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
    // Returns the populated department document for a known id
    it('should return a department by id', async () => {
      mockDepartmentModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDepartment),
        }),
      });

      const result = await service.findOne('dept-1');
      expect(result).toEqual(mockDepartment);
    });

    // Unknown id must throw NotFoundException rather than returning null silently
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
    // Returns all departments where the manager id appears in the managerIds array
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
    // Happy path: returns the updated department document after applying the patch
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

    // Updating a non-existent department must throw NotFoundException
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

    // Leading and trailing whitespace is stripped from the name before updating
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
    // Happy path: deleted document is returned after removal
    it('should delete a department successfully', async () => {
      mockDepartmentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDepartment),
      });

      const result = await service.remove('dept-1');
      expect(result).toEqual(mockDepartment);
    });

    // Attempting to delete a non-existent department must throw NotFoundException
    it('should throw NotFoundException when department not found', async () => {
      mockDepartmentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
