import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      const mockResult = {
        token: 'mock.jwt.token',
        mustChangePassword: false,
        user: { id: '1', name: 'John', email: 'john@example.com', role: 'EMPLOYEE' },
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authService.login).toHaveBeenCalledWith('john@example.com', 'password123');
      expect(result).toEqual(mockResult);
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('should call authService.changePassword with userId and new password', async () => {
      const mockResult = { message: 'Mot de passe mis à jour avec succès' };
      mockAuthService.changePassword.mockResolvedValue(mockResult);

      const req = { user: { sub: 'user123' } };
      const result = await controller.changePassword(req, { newPassword: 'newPass123' });

      expect(authService.changePassword).toHaveBeenCalledWith('user123', 'newPass123');
      expect(result).toEqual(mockResult);
    });
  });
});
