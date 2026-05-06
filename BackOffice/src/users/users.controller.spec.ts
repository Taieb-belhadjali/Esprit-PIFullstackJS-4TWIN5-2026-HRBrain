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
    // Retourne le profil de l'utilisateur actuellement connecté en extrayant son id depuis le claim sub du JWT
    it('should return the current user profile', async () => {
      const user = { _id: 'user1', name: 'John' };
      mockUsersService.findOne.mockResolvedValue(user);
      expect(await controller.getMe({ user: { sub: 'user1' } })).toEqual(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user1');
    });
  });

  describe('getCvFile', () => {
    // Quand l'utilisateur possède un CV, son chemin est retourné pour que le frontend affiche un lien de téléchargement
    it('should return cv path when cv exists', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: '/path/to/cv.pdf' });
      expect(await controller.getCvFile('user1')).toEqual({ cvPath: '/path/to/cv.pdf' });
    });

    // Un utilisateur sans CV doit recevoir une erreur claire plutôt qu'un chemin null qui provoquerait un téléchargement cassé
    it('should throw BadRequestException when no cv', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: null });
      await expect(controller.getCvFile('user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('downloadCv', () => {
    afterEach(() => jest.restoreAllMocks());

    // Quand l'utilisateur n'a pas de champ cv, le fichier ne peut pas exister — NotFoundException évite une réponse trompeuse
    it('should throw NotFoundException when user has no cv', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: null });
      const mockRes = { setHeader: jest.fn() };
      await expect(controller.downloadCv('user1', mockRes as any)).rejects.toThrow(NotFoundException);
    });

    // Si le chemin CV est stocké en base mais que le fichier a été supprimé du disque, BadRequestException évite un stream cassé
    it('should throw BadRequestException when cv file does not exist on disk', async () => {
      mockUsersService.findOne.mockResolvedValue({ cv: '/some/path/cv.pdf' });
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const mockRes = { setHeader: jest.fn() };
      await expect(controller.downloadCv('user1', mockRes as any)).rejects.toThrow(BadRequestException);
    });

    // Cas nominal : le fichier est trouvé sur le disque, le bon header Content-Type est défini et le flux est pipé vers la réponse
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

    // Quand le stream émet une erreur et que les headers ne sont pas encore envoyés, une réponse 500 est renvoyée au lieu de planter
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
    // Vérifie que les paramètres page, limit et role sont correctement parsés et transmis au service
    it('should return paginated users with role filter', async () => {
      const result = { users: [], total: 0 };
      mockUsersService.findAll.mockResolvedValue(result);
      expect(await controller.findAll('1', '50', 'EMPLOYEE')).toEqual(result);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 50, role: 'EMPLOYEE', search: undefined });
    });

    // Les entrées invalides (0, 'abc') doivent être remplacées par des valeurs sûres par défaut (page=1, limit=50) pour éviter les erreurs en base
    it('should default to page=1 limit=50 for invalid inputs', async () => {
      mockUsersService.findAll.mockResolvedValue({ users: [], total: 0 });
      await controller.findAll('0', 'abc');
      expect(mockUsersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 50, role: undefined, search: undefined });
    });
  });

  describe('findOne', () => {
    // Délègue la recherche par id au service et retourne le document utilisateur
    it('should return a user by id', async () => {
      const user = { _id: 'user1', name: 'John' };
      mockUsersService.findOne.mockResolvedValue(user);
      expect(await controller.findOne('user1')).toEqual(user);
    });
  });

  describe('create', () => {
    // Seul le SUPERADMIN peut créer des utilisateurs HR — tout autre rôle doit être bloqué pour protéger la hiérarchie des permissions
    it('should throw ForbiddenException when non-SUPERADMIN creates HR', () => {
      expect(() => controller.create({ role: 'HR' }, null as any, { user: { role: 'HR' } })).toThrow(ForbiddenException);
    });

    // Le SUPERADMIN est autorisé à créer des utilisateurs HR — vérifie que le guard est correctement contourné pour ce rôle
    it('should create HR user when SUPERADMIN', async () => {
      const user = { _id: 'new', role: 'HR' };
      mockUsersService.create.mockResolvedValue(user);
      expect(await controller.create({ role: 'HR' }, null as any, { user: { role: 'SUPERADMIN' } })).toEqual(user);
    });

    // La création d'un EMPLOYEE n'a pas de restriction de rôle — tout utilisateur admin peut la réaliser
    it('should create EMPLOYEE user without role restriction', async () => {
      const user = { _id: 'new', role: 'EMPLOYEE' };
      mockUsersService.create.mockResolvedValue(user);
      expect(await controller.create({ role: 'EMPLOYEE' }, null as any, { user: { role: 'HR' } })).toEqual(user);
    });
  });

  describe('update', () => {
    // Le contrôleur transmet le DTO de mise à jour au service et retourne le document mis à jour
    it('should update a user', async () => {
      const updated = { _id: 'user1', name: 'Jane' };
      mockUsersService.update.mockResolvedValue(updated);
      expect(await controller.update('user1', { name: 'Jane' })).toEqual(updated);
    });
  });

  describe('remove', () => {
    // Le contrôleur délègue la suppression au service et retourne le résultat
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue({ deleted: true });
      expect(await controller.remove('user1')).toEqual({ deleted: true });
    });
  });

  describe('getAnalyticsStats', () => {
    // Le rôle MANAGER reçoit son propre id pour que le service scinde les statistiques à ses départements uniquement
    it('should pass managerId for MANAGER role', async () => {
      mockUsersService.getAnalyticsStats.mockResolvedValue({ employees: 10 });
      await controller.getAnalyticsStats({ user: { role: 'MANAGER', sub: 'mgr1' } });
      expect(mockUsersService.getAnalyticsStats).toHaveBeenCalledWith('mgr1', undefined);
    });

    // Les rôles non-MANAGER (HR, SUPERADMIN) reçoivent un managerId undefined pour obtenir les statistiques globales
    it('should pass undefined managerId for non-MANAGER', async () => {
      mockUsersService.getAnalyticsStats.mockResolvedValue({});
      await controller.getAnalyticsStats({ user: { role: 'HR', sub: 'hr1' } });
      expect(mockUsersService.getAnalyticsStats).toHaveBeenCalledWith(undefined, undefined);
    });

    // La chaîne de date since est convertie en objet Date avant d'être transmise au service
    it('should parse since date when provided', async () => {
      mockUsersService.getAnalyticsStats.mockResolvedValue({});
      await controller.getAnalyticsStats({ user: { role: 'HR', sub: 'hr1' } }, '2026-01-01');
      expect(mockUsersService.getAnalyticsStats).toHaveBeenCalledWith(undefined, new Date('2026-01-01'));
    });
  });
});
