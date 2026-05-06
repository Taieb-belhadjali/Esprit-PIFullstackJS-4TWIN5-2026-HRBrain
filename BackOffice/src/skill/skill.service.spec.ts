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
    // Happy path: skill is persisted and the saved document is returned
    it('should create a skill successfully', async () => {
      const dto = { name: 'JavaScript', category: 'Frontend' };
      const result = await service.create(dto);
      expect(result).toEqual(mockSkill);
    });

    // An empty name string must be rejected before hitting the DB — clear error message for the caller
    it('should throw error when name is empty', async () => {
      await expect(service.create({ name: '' })).rejects.toThrow(
        'Le nom du skill ne peut pas être vide',
      );
    });

    // A whitespace-only name is semantically empty and must also be rejected
    it('should throw error when name is only whitespace', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(
        'Le nom du skill ne peut pas être vide',
      );
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    // Without a filter, the service queries with an empty filter object and returns all skills
    it('should return all skills without filter', async () => {
      const skills = [mockSkill];
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(skills),
      });

      const result = await service.findAll();
      expect(result).toEqual(skills);
      expect(mockSkillModel.find).toHaveBeenCalledWith({});
    });

    // When a departmentId is provided, the query is scoped to skills belonging to that department
    it('should filter by departmentId when provided', async () => {
      const skills = [mockSkill];
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(skills),
      });

      const result = await service.findAll('dept-1');
      expect(result).toEqual(skills);
      expect(mockSkillModel.find).toHaveBeenCalledWith({ departmentId: 'dept-1' });
    });

    // Empty collection returns an empty array — no error thrown
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
    // Returns the skill document for a known id
    it('should return a skill by id', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.findOne('skill-1');
      expect(result).toEqual(mockSkill);
    });

    // Unknown id must throw NotFoundException rather than returning null silently
    it('should throw NotFoundException when skill not found', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    // The error message includes the id so callers can identify which skill was not found
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
    // Happy path: returns the updated skill document after applying the patch
    it('should update a skill successfully', async () => {
      const updatedSkill = { ...mockSkill, name: 'TypeScript' };
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSkill),
      });

      const result = await service.update('skill-1', { name: 'TypeScript' });
      expect(result).toEqual(updatedSkill);
    });

    // Updating a non-existent skill must throw NotFoundException
    it('should throw NotFoundException when skill not found', async () => {
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    // Verifies that { returnDocument: 'after' } is passed so the updated document is returned, not the old one
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
    // Happy path: deleted skill document is returned after removal
    it('should delete a skill successfully', async () => {
      mockSkillModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.remove('skill-1');
      expect(result).toEqual(mockSkill);
    });

    // Attempting to delete a non-existent skill must throw NotFoundException
    it('should throw NotFoundException when skill not found', async () => {
      mockSkillModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
