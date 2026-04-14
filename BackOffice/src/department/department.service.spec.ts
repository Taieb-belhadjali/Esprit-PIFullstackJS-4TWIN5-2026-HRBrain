import { NotFoundException } from '@nestjs/common';
import { DepartmentService } from './department.service';

describe('DepartmentService', () => {
  const mockSave = jest.fn();

  const mockModel: any = jest.fn().mockImplementation((payload) => ({
    ...payload,
    save: mockSave,
  }));

  mockModel.find = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  mockModel.findByIdAndDelete = jest.fn();

  let service: DepartmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DepartmentService(mockModel);
  });

  describe('create', () => {
    it('creates a department with trimmed fields', async () => {
      const expected = { _id: '1', name: 'IT', user_id: 'u1' };
      mockSave.mockResolvedValue(expected);

      const result = await service.create({ name: '  IT  ', user_id: '  u1  ' });

      expect(mockModel).toHaveBeenCalledWith({ name: 'IT', user_id: 'u1' });
      expect(result).toEqual(expected);
    });

    it('throws when name is empty', async () => {
      await expect(service.create({ name: '  ', user_id: 'u1' })).rejects.toThrow(
        'Le nom du département ne peut pas être vide',
      );
    });

    it('throws when user_id is empty', async () => {
      await expect(service.create({ name: 'IT', user_id: '  ' })).rejects.toThrow(
        'Le user_id du manager ne peut pas être vide',
      );
    });
  });

  describe('findAll', () => {
    it('returns all departments', async () => {
      const expected = [{ _id: '1' }, { _id: '2' }];
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expected),
      });

      const result = await service.findAll();
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('returns one department by id', async () => {
      const expected = { _id: '1', name: 'IT' };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expected),
      });

      const result = await service.findOne('1');
      expect(result).toEqual(expected);
    });

    it('throws NotFoundException when department does not exist', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('404')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates with trimmed values', async () => {
      const expected = { _id: '1', name: 'HR', user_id: 'u2' };
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expected),
      });

      const result = await service.update('1', { name: '  HR  ', user_id: '  u2  ' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { name: 'HR', user_id: 'u2' },
        { new: true },
      );
      expect(result).toEqual(expected);
    });

    it('throws NotFoundException when update target does not exist', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('404', { name: 'HR' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes a department by id', async () => {
      const expected = { _id: '1', name: 'IT' };
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expected),
      });

      const result = await service.remove('1');
      expect(result).toEqual(expected);
    });

    it('throws NotFoundException when delete target does not exist', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('404')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
