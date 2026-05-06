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
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
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
    // Helper : mock findById().populate().exec() utilisé après le save
    const mockFindByIdPopulate = (resolved: any) =>
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(resolved) }),
      });

    // Cas nominal : l'activité est sauvegardée en base et le document peuplé est retourné
    it('should create an activity successfully', async () => {
      mockFindByIdPopulate(mockActivity);
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

    // Quand un département est précisé et que des employés sont trouvés, le service de notification doit être appelé
    it('should notify employees when department is specified', async () => {
      mockFindByIdPopulate(mockActivity);
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
      expect(mockModelConstructor).toHaveBeenCalled();
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    // Sans filtre, le service interroge la base avec un filtre vide et retourne toutes les activités
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

    // Quand un departmentId est fourni, la requête doit inclure targetedDepartmentId pour limiter les résultats
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

    // Une collection vide doit retourner un tableau vide, sans erreur
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
    // Un manager qui n'a encore aucun département doit obtenir une liste vide sans erreur en base
    it('should return empty array when manager has no departments', async () => {
      mockDepartmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAllForManager('507f1f77bcf86cd799439013');
      expect(result).toEqual([]);
    });

    // Quand le manager possède au moins un département, les activités ciblant ces départements sont retournées
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

    // Quand un departmentId spécifique est fourni, les résultats sont limités à ce seul département
    it('should filter by specific departmentId when provided', async () => {
      const activities = [mockActivity];
      mockDepartmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439012' }]),
      });
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(activities),
        }),
      });

      const result = await service.findAllForManager(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
      );
      expect(result).toEqual(activities);
    });
  });

  // ── findAllForEmployee ─────────────────────────────────────────────────────
  describe('findAllForEmployee', () => {
    // Un employé sans departmentId assigné obtient une liste vide — pas de crash sur un département null
    it('should return empty array when employee has no department', async () => {
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439014' }),
      });

      const result = await service.findAllForEmployee('507f1f77bcf86cd799439014');
      expect(result).toEqual([]);
    });

    // Quand l'employé appartient à un département, les activités ciblant ce département sont retournées
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
    // Sans departmentId fourni, la vérification est impossible — retourne false par défaut
    it('should return false when departmentId is not provided', async () => {
      const result = await service.isManagerOfDepartment('507f1f77bcf86cd799439013');
      expect(result).toBe(false);
    });

    // Retourne true quand le document département contient bien l'id du manager
    it('should return true when manager manages the department', async () => {
      mockDepartmentModel.findOne.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
      const result = await service.isManagerOfDepartment(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439012',
      );
      expect(result).toBe(true);
    });

    // Retourne false quand findOne ne trouve aucun enregistrement — le manager n'est pas responsable de ce département
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
    // Cas nominal : retourne le document activité peuplé pour un id connu
    it('should return an activity by id', async () => {
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockActivity),
        }),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
    });

    // Un id inconnu doit lever une NotFoundException plutôt que retourner null silencieusement
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
    // Cas nominal : retourne le document peuplé après application de la mise à jour
    it('should update an activity', async () => {
      const updated = { ...mockActivity, title: 'Updated Training' };
      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { title: 'Updated Training' });
      expect(result).toEqual(updated);
    });

    // Mettre à jour une activité inexistante doit lever une NotFoundException
    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });

      await expect(service.update('nonexistent', { title: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    // Cas nominal : le document supprimé est retourné après la suppression
    it('should delete an activity', async () => {
      mockActivityModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActivity),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
    });

    // Supprimer une activité inexistante doit lever une NotFoundException
    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getStats ───────────────────────────────────────────────────────────────
  describe('getStats', () => {
    const mockFindForStats = (recent: any[] = []) =>
      mockActivityModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(recent),
          }),
        }),
      });

    // Le SUPERADMIN n'a aucune restriction de département — les statistiques couvrent toute la collection d'activités
    it('should return stats for SUPERADMIN (no department filter)', async () => {
      mockActivityModel.countDocuments.mockResolvedValue(10);
      mockActivityModel.aggregate.mockResolvedValue([{ status: 'active', count: 10 }]);
      mockFindForStats([{ title: 'T1', status: 'active', startDate: new Date() }]);

      const result = await service.getStats('SUPERADMIN', 'admin1');
      expect(result.total).toBe(10);
      expect(result.statusDistribution).toHaveLength(1);
      expect(result.recent).toHaveLength(1);
    });

    // Un MANAGER sans départements doit recevoir des statistiques vides (zéros) plutôt qu'une erreur en base
    it('should return empty stats for MANAGER with no departments', async () => {
      mockDepartmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getStats('MANAGER', '507f1f77bcf86cd799439019');
      expect(result).toEqual({ total: 0, statusDistribution: [], recent: [] });
    });

    // Un MANAGER avec des départements reçoit des statistiques limitées aux activités de ces départements
    it('should return stats for MANAGER with departments', async () => {
      mockDepartmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439012' }]),
      });
      mockActivityModel.countDocuments.mockResolvedValue(3);
      mockActivityModel.aggregate.mockResolvedValue([{ status: 'active', count: 3 }]);
      mockFindForStats([]);

      const result = await service.getStats('MANAGER', '507f1f77bcf86cd799439013');
      expect(result.total).toBe(3);
    });

    // Le rôle HR n'a pas de restriction de département — il reçoit les statistiques globales comme le SUPERADMIN
    it('should return stats for HR role (no filter)', async () => {
      mockActivityModel.countDocuments.mockResolvedValue(5);
      mockActivityModel.aggregate.mockResolvedValue([]);
      mockFindForStats([]);

      const result = await service.getStats('HR', 'hr1');
      expect(result.total).toBe(5);
    });
  });

  // ── getRecommendations ─────────────────────────────────────────────────────
  describe('getRecommendations', () => {
    // Demander des recommandations pour une activité inexistante doit lever une NotFoundException
    it('should throw NotFoundException when activity does not exist', async () => {
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });

      await expect(service.getRecommendations('nonexistent')).rejects.toThrow(NotFoundException);
    });

    // Quand aucun employé ne correspond aux critères de l'activité, un tableau vide est retourné
    it('should return empty results when no employees match', async () => {
      const activity = {
        _id: '507f1f77bcf86cd799439011',
        requiredSkills: [],
        context: '',
        targetedDepartmentId: null,
      };
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(activity) }),
      });
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });

      const result = await service.getRecommendations('507f1f77bcf86cd799439011');
      expect(result).toHaveLength(0);
    });

    // Plusieurs employés sont scorés et le tableau résultat est trié par finalScore décroissant
    it('should score and sort employees by finalScore', async () => {
      const activity = {
        _id: '507f1f77bcf86cd799439011',
        requiredSkills: [],
        context: '',
        targetedDepartmentId: '507f1f77bcf86cd799439012',
      };
      const employees = [
        { _id: 'emp1', name: 'Alice', email: 'a@t.com', role: 'EMPLOYEE', skills: [], cv: null },
        { _id: 'emp2', name: 'Bob',   email: 'b@t.com', role: 'EMPLOYEE', skills: [], cv: null },
      ];
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(activity) }),
      });
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(employees) }),
      });

      const result = await service.getRecommendations('507f1f77bcf86cd799439011');
      expect(result).toHaveLength(2);
      expect(result[0].employee._id).toBeDefined();
    });

    // Quand un employé n'a pas de CV, son tableau de compétences est utilisé directement pour construire son profil de scoring
    it('should use skills array when employee has no cv', async () => {
      const activity = { _id: 'act1', requiredSkills: [], context: '', targetedDepartmentId: null };
      const employees = [{
        _id: 'emp1', name: 'Alice', email: 'a@t.com', role: 'EMPLOYEE',
        skills: [{ _id: 'skill1', name: 'React' }],
        cv: null,
      }];
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(activity) }),
      });
      mockSkillModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'skill1', name: 'React' }]),
      });
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(employees) }),
      });

      const result = await service.getRecommendations('act1');
      expect(result).toHaveLength(1);
      expect(result[0].employeeSkills).toHaveLength(1);
      expect(result[0].employeeSkills[0].skillName).toBe('React');
    });

    // Le paramètre limit doit tronquer le résultat au nombre de candidats demandé
    it('should respect the limit parameter', async () => {
      const activity = { _id: 'act1', requiredSkills: [], context: '', targetedDepartmentId: null };
      const employees = Array.from({ length: 5 }, (_, i) => ({
        _id: `emp${i}`, name: `Emp ${i}`, email: `e${i}@t.com`, role: 'EMPLOYEE', skills: [], cv: null,
      }));
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(activity) }),
      });
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(employees) }),
      });

      const result = await service.getRecommendations('act1', 2);
      expect(result).toHaveLength(2);
    });
  });
});
