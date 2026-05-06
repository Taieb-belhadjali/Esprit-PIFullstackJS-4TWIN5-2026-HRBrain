import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { NotFoundException } from '@nestjs/common';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let service: DepartmentService;

  const mockDepartment = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Engineering',
    managerIds: [],
  };

  const mockDepartmentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByManager: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [{ provide: DepartmentService, useValue: mockDepartmentService }],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
    service = module.get<DepartmentService>(DepartmentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    // Controller delegates creation to the service and returns the created department
    it('should create a department', async () => {
      mockDepartmentService.create.mockResolvedValue(mockDepartment);
      const result = await controller.create({ name: 'Engineering', managerIds: [] });
      expect(result).toEqual(mockDepartment);
      expect(service.create).toHaveBeenCalledWith({ name: 'Engineering', managerIds: [] });
    });

    // Propagates service errors (e.g. empty name validation) to the caller
    it('should throw error when creation fails', async () => {
      mockDepartmentService.create.mockRejectedValue(new Error('Creation failed'));
      await expect(controller.create({ name: '', managerIds: [] })).rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    // Returns all departments without any filter
    it('should return all departments', async () => {
      const departments = [mockDepartment];
      mockDepartmentService.findAll.mockResolvedValue(departments);
      const result = await controller.findAll();
      expect(result).toEqual(departments);
    });

    // Empty collection returns an empty array — no error thrown
    it('should return empty array when no departments', async () => {
      mockDepartmentService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findMine', () => {
    // Extracts the user's id from the JWT sub claim and returns only their departments
    it('should return departments for the logged-in manager', async () => {
      const departments = [mockDepartment];
      mockDepartmentService.findByManager.mockResolvedValue(departments);
      const req = { user: { sub: '507f1f77bcf86cd799439012' } };
      const result = await controller.findMine(req);
      expect(result).toEqual(departments);
      expect(service.findByManager).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('findByManager', () => {
    // Admin-facing route: returns departments for any manager by their explicit id
    it('should return departments by manager id', async () => {
      const departments = [mockDepartment];
      mockDepartmentService.findByManager.mockResolvedValue(departments);
      const result = await controller.findByManager('507f1f77bcf86cd799439012');
      expect(result).toEqual(departments);
    });
  });

  describe('findOne', () => {
    // Returns the department document for a known id
    it('should return a department by id', async () => {
      mockDepartmentService.findOne.mockResolvedValue(mockDepartment);
      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockDepartment);
    });

    // Propagates NotFoundException from the service when the department does not exist
    it('should throw NotFoundException when department not found', async () => {
      mockDepartmentService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    // Forwards the patch DTO to the service and returns the updated document
    it('should update a department', async () => {
      const updated = { ...mockDepartment, name: 'Updated' };
      mockDepartmentService.update.mockResolvedValue(updated);
      const result = await controller.update('507f1f77bcf86cd799439011', { name: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    // Delegates deletion to the service and returns the deleted document
    it('should delete a department', async () => {
      mockDepartmentService.remove.mockResolvedValue(mockDepartment);
      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockDepartment);
    });

    // Propagates NotFoundException from the service when the department does not exist
    it('should throw NotFoundException when department not found', async () => {
      mockDepartmentService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
