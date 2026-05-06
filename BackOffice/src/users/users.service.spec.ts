import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { User } from './shemas/user.shema';
import { Skill } from '../skill/skill.schema';
import { Department } from '../department/department.schema';
import { Activity } from '../activity/activity.schema';
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

  // Chaîne de mock : .select().populate().populate().skip().limit().lean()
  const makeFindChain = (resolved: any) => ({
    select: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(resolved),
            }),
          }),
        }),
      }),
    }),
  });

  // Chaîne de mock : .populate().populate()
  const makePopulateChain = (resolved: any) => ({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(resolved),
    }),
  });

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(mockUser),
  }));

  const mockSkillModel = {
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockDepartmentModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({}),
  };

  const mockActivityModel = {
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
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
        { provide: getModelToken(Skill.name),       useValue: mockSkillModel },
        { provide: getModelToken(Department.name),  useValue: mockDepartmentModel },
        { provide: getModelToken(Activity.name),    useValue: mockActivityModel },
        { provide: NotificationService,             useValue: mockNotifService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    // Vérifie que le service retourne un tableau de données et un total pour la pagination côté frontend
    it('should return paginated users', async () => {
      const users = [mockUser];
      mockUserModel.find.mockReturnValue(makeFindChain(users));
      mockUserModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 50 });
      expect(result.data).toEqual(users);
      expect(result.total).toBe(1);
      expect(mockUserModel.find).toHaveBeenCalled();
    });

    // Une collection vide doit retourner un tableau vide et total=0, sans générer d'erreur
    it('should return empty array when no users', async () => {
      mockUserModel.find.mockReturnValue(makeFindChain([]));
      mockUserModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 50 });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    // Cas nominal : le service retourne le document utilisateur peuplé pour un id connu
    it('should return a user by id', async () => {
      mockUserModel.findById.mockReturnValue(makePopulateChain(mockUser));

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockUser);
    });

    // Un id inconnu doit lever une NotFoundException plutôt que retourner null silencieusement
    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockReturnValue(makePopulateChain(null));
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    // Le message d'erreur doit être 'User not found' pour que les consommateurs de l'API identifient la cause
    it('should throw NotFoundException with correct message', async () => {
      mockUserModel.findById.mockReturnValue(makePopulateChain(null));
      await expect(service.findOne('nonexistent')).rejects.toThrow('User not found');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    // Cas nominal : le document mis à jour est retourné après application du patch DTO
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      mockUserModel.findByIdAndUpdate.mockReturnValue(makePopulateChain(updatedUser));

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'Jane Doe' } as any);
      expect(result).toEqual(updatedUser);
    });

    // Tenter de mettre à jour un utilisateur inexistant doit lever une NotFoundException
    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(makePopulateChain(null));
      await expect(service.update('nonexistent', { name: 'Test' } as any)).rejects.toThrow(NotFoundException);
    });

    // Vérifie que l'option { new: true } est passée pour que Mongoose retourne le document mis à jour et non l'ancien
    it('should call findByIdAndUpdate with new: true', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(makePopulateChain(mockUser));

      await service.update('507f1f77bcf86cd799439011', { name: 'Test' } as any);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { name: 'Test' },
        { new: true },
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    // Un utilisateur non-EMPLOYEE (HR) est supprimé sans cascade — seul le document utilisateur est effacé
    it('should delete a non-employee user successfully', async () => {
      const hrUser = { ...mockUser, role: 'HR' };
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(hrUser),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ message: 'User deleted' });
    });

    // Quand un MANAGER est supprimé, ses activités et ses appartenances aux départements doivent aussi être nettoyées (suppression en cascade)
    it('should cascade-delete activities for MANAGER', async () => {
      const managerUser = { ...mockUser, role: 'MANAGER' };
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(managerUser),
      });
      mockActivityModel.deleteMany.mockResolvedValue({ deletedCount: 3 });
      mockDepartmentModel.updateMany.mockResolvedValue({});

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ message: 'User deleted' });
      expect(mockActivityModel.deleteMany).toHaveBeenCalled();
      expect(mockDepartmentModel.updateMany).toHaveBeenCalled();
    });

    // Tenter de supprimer un utilisateur inexistant doit lever une NotFoundException
    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    // Le message d'erreur doit être 'User not found' pour que les consommateurs de l'API identifient la cause
    it('should throw NotFoundException with correct message', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove('nonexistent')).rejects.toThrow('User not found');
    });
  });

  // ── Scénario 4 — notifyNewEmployeeInDepartment ────────────────────────────
  describe('Scénario 4 — notifyNewEmployeeInDepartment', () => {
    // Quand un nouvel EMPLOYEE rejoint un département, tous les managers de ce département doivent recevoir une notification
    it('should notify managers when a new employee joins their department', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // generateCvFile appelle skillModel.find({}, ...).lean()
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const savedUser = { ...mockUser, _id: '507f1f77bcf86cd799439099', cv: undefined };
      const mockSave = jest.fn().mockResolvedValue(savedUser);
      mockModelConstructor.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }));

      // findById : supporte à la fois .lean() (étape CSV) et direct-await + .populate() (retour final)
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(savedUser),
        populate: jest.fn().mockResolvedValue(savedUser),
      });
      // findByIdAndUpdate (patch auto-CV) est attendu directement — pas de chaîne nécessaire
      mockUserModel.findByIdAndUpdate.mockResolvedValue(savedUser);

      const dept = { _id: '507f1f77bcf86cd799439012', name: 'Engineering', managerIds: ['507f1f77bcf86cd799439013'] };
      mockDepartmentModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(dept),
      });

      await service.create({ name: 'Alice', email: 'alice@test.com', password: 'pass', role: 'EMPLOYEE', departmentId: dept._id } as any);

      expect(mockNotifService.notifyNewEmployeeInDepartment).toHaveBeenCalledWith(
        ['507f1f77bcf86cd799439013'],
        'Alice',
        'Engineering',
      );
    });
  });
});
