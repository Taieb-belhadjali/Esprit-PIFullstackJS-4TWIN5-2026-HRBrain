jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

const mockUsersService = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getAnalyticsStats: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return the current user profile', async () => {
      const user = { _id: 'user1', name: 'John' };
      mockUsersService.findOne.mockResolvedValue(user);
      expect(await controller.getMe({ user: { sub: 'user1' } })).toEqual(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user1');
    });
  });

  describe('getCvFile', () => {
    it('should return cv path when cv exists', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: '/path/to/cv.pdf' });
      expect(await controller.getCvFile('user1')).toEqual({ cvPath: '/path/to/cv.pdf' });
    });

    it('should throw BadRequestException when no cv', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: null });
      await expect(controller.getCvFile('user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('downloadCv', () => {
    afterEach(() => jest.restoreAllMocks());

    it('should throw NotFoundException when user has no cv', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: null });
      const mockRes = { setHeader: jest.fn() };
      await expect(controller.downloadCv('user1', mockRes as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when cv file does not exist on disk', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: '/some/path/cv.pdf' });
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const mockRes = { setHeader: jest.fn() };
      await expect(controller.downloadCv('user1', mockRes as any)).rejects.toThrow(BadRequestException);
    });

    it('should stream cv file when it exists on disk', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: '/some/path/cv.txt' });
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const mockStream = { pipe: jest.fn(), on: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValueOnce(mockStream);
      const mockRes = { setHeader: jest.fn() };
      await controller.downloadCv('user1', mockRes as any);
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    });

    it('should handle stream errors and send 500 when headers not sent', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: '/some/path/cv.txt' });
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const mockStream = { pipe: jest.fn(), on: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValueOnce(mockStream);
      const mockRes = { setHeader: jest.fn(), headersSent: false, status: jest.fn().mockReturnThis(), send: jest.fn() };
      await controller.downloadCv('user1', mockRes as any);

      const [, errorCallback] = mockStream.on.mock.calls[0];
      errorCallback(new Error('Read error'));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Erreur lors du téléchargement');
    });
  });

  describe('findAll', () => {
    it('should return paginated users with role filter', async () => {
      const result = { users: [], total: 0 };
      mockUsersService.findAll.mockResolvedValue(result);
      expect(await controller.findAll('1', '50', 'EMPLOYEE')).toEqual(result);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 50, role: 'EMPLOYEE', search: undefined });
    });

    it('should default to page=1 limit=50 for invalid inputs', async () => {
      mockUsersService.findAll.mockResolvedValue({ users: [], total: 0 });
      await controller.findAll('0', 'abc');
      expect(mockUsersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 50, role: undefined, search: undefined });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { _id: 'user1', name: 'John' };
      mockUsersService.findOne.mockResolvedValue(user);
      expect(await controller.findOne('user1')).toEqual(user);
    });
  });

  describe('create', () => {
    it('should throw ForbiddenException when non-SUPERADMIN creates HR', () => {
      expect(() => controller.create({ role: 'HR' }, null as any, { user: { role: 'HR' } })).toThrow(ForbiddenException);
    });

    it('should create HR user when SUPERADMIN', async () => {
      const user = { _id: 'new', role: 'HR' };
      mockUsersService.create.mockResolvedValue(user);
      expect(await controller.create({ role: 'HR' }, null as any, { user: { role: 'SUPERADMIN' } })).toEqual(user);
    });

    it('should create EMPLOYEE user without role restriction', async () => {
      const user = { _id: 'new', role: 'EMPLOYEE' };
      mockUsersService.create.mockResolvedValue(user);
      expect(await controller.create({ role: 'EMPLOYEE' }, null as any, { user: { role: 'HR' } })).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updated = { _id: 'user1', name: 'Jane' };
      mockUsersService.update.mockResolvedValue(updated);
      expect(await controller.update('user1', { name: 'Jane' })).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue({ deleted: true });
      expect(await controller.remove('user1')).toEqual({ deleted: true });
    });
  });

  describe('getAnalyticsStats', () => {
    it('should pass managerId for MANAGER role', async () => {
      mockUsersService.getAnalyticsStats.mockResolvedValue({ employees: 10 });
      await controller.getAnalyticsStats({ user: { role: 'MANAGER', sub: 'mgr1' } });
      expect(mockUsersService.getAnalyticsStats).toHaveBeenCalledWith('mgr1', undefined);
    });

    it('should pass undefined managerId for non-MANAGER', async () => {
      mockUsersService.getAnalyticsStats.mockResolvedValue({});
      await controller.getAnalyticsStats({ user: { role: 'HR', sub: 'hr1' } });
      expect(mockUsersService.getAnalyticsStats).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should parse since date when provided', async () => {
      mockUsersService.getAnalyticsStats.mockResolvedValue({});
      await controller.getAnalyticsStats({ user: { role: 'HR', sub: 'hr1' } }, '2026-01-01');
      expect(mockUsersService.getAnalyticsStats).toHaveBeenCalledWith(undefined, new Date('2026-01-01'));
    });
  });
});
