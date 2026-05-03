import { Test, TestingModule } from '@nestjs/testing';
import { SkillService } from './skill.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Skill } from './skill.schema';

describe('SkillService', () => {
  let service: SkillService;

  const mockSkill = {
    _id: 'skill-1',
    name: 'JavaScript',
    category: 'Frontend',
    departmentId: 'dept-1',
  };

  const mockSkillModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(mockSkill),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillService,
        {
          provide: getModelToken(Skill.name),
          useValue: Object.assign(mockModelConstructor, mockSkillModel),
        },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);
    jest.clearAllMocks();
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a skill successfully', async () => {
      const dto = { name: 'JavaScript', category: 'Frontend' };
      const result = await service.create(dto);
      expect(result).toEqual(mockSkill);
    });

    it('should throw error when name is empty', async () => {
      await expect(service.create({ name: '' })).rejects.toThrow(
        'Le nom du skill ne peut pas être vide',
      );
    });

    it('should throw error when name is only whitespace', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(
        'Le nom du skill ne peut pas être vide',
      );
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all skills without filter', async () => {
      const skills = [mockSkill];
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(skills),
      });

      const result = await service.findAll();
      expect(result).toEqual(skills);
      expect(mockSkillModel.find).toHaveBeenCalledWith({});
    });

    it('should filter by departmentId when provided', async () => {
      const skills = [mockSkill];
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(skills),
      });

      const result = await service.findAll('dept-1');
      expect(result).toEqual(skills);
      expect(mockSkillModel.find).toHaveBeenCalledWith({ departmentId: 'dept-1' });
    });

    it('should return empty array when no skills found', async () => {
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a skill by id', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.findOne('skill-1');
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('bad-id')).rejects.toThrow(
        'Skill avec id bad-id non trouvé',
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a skill successfully', async () => {
      const updatedSkill = { ...mockSkill, name: 'TypeScript' };
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSkill),
      });

      const result = await service.update('skill-1', { name: 'TypeScript' });
      expect(result).toEqual(updatedSkill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call findByIdAndUpdate with correct params', async () => {
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      await service.update('skill-1', { name: 'Updated' });
      expect(mockSkillModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'skill-1',
        { name: 'Updated' },
        { returnDocument: 'after' },
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a skill successfully', async () => {
      mockSkillModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.remove('skill-1');
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockSkillModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
