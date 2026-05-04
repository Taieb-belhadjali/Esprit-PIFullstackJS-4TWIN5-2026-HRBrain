import { Test, TestingModule } from '@nestjs/testing';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';
import { NotFoundException } from '@nestjs/common';

describe('SkillController', () => {
  let controller: SkillController;
  let service: SkillService;

  const mockSkill = {
    _id: '507f1f77bcf86cd799439011',
    name: 'JavaScript',
    category: 'Frontend',
    departmentId: '507f1f77bcf86cd799439012',
  };

  const mockSkillService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillController],
      providers: [{ provide: SkillService, useValue: mockSkillService }],
    }).compile();

    controller = module.get<SkillController>(SkillController);
    service = module.get<SkillService>(SkillService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a skill', async () => {
      mockSkillService.create.mockResolvedValue(mockSkill);
      const result = await controller.create({ name: 'JavaScript', category: 'Frontend' });
      expect(result).toEqual(mockSkill);
      expect(service.create).toHaveBeenCalledWith({ name: 'JavaScript', category: 'Frontend' });
    });

    it('should throw error when creation fails', async () => {
      mockSkillService.create.mockRejectedValue(new Error('Skill name cannot be empty'));
      await expect(controller.create({ name: '' })).rejects.toThrow('Skill name cannot be empty');
    });
  });

  describe('findAll', () => {
    it('should return all skills without filter', async () => {
      const skills = [mockSkill];
      mockSkillService.findAll.mockResolvedValue(skills);
      const result = await controller.findAll();
      expect(result).toEqual(skills);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return skills filtered by departmentId', async () => {
      const skills = [mockSkill];
      mockSkillService.findAll.mockResolvedValue(skills);
      const result = await controller.findAll('507f1f77bcf86cd799439012');
      expect(result).toEqual(skills);
      expect(service.findAll).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    it('should return empty array when no skills', async () => {
      mockSkillService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a skill by id', async () => {
      mockSkillService.findOne.mockResolvedValue(mockSkill);
      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockSkillService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a skill', async () => {
      const updated = { ...mockSkill, name: 'TypeScript' };
      mockSkillService.update.mockResolvedValue(updated);
      const result = await controller.update('507f1f77bcf86cd799439011', { name: 'TypeScript' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockSkillService.update.mockRejectedValue(new NotFoundException());
      await expect(controller.update('nonexistent', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a skill', async () => {
      mockSkillService.remove.mockResolvedValue(mockSkill);
      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockSkillService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
