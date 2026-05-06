import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
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

  // ─── googleAuth ───────────────────────────────────────────────────────────────

  describe('googleAuth', () => {
    it('should return undefined (guard handles redirect to Google)', () => {
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  // ─── googleCallback ───────────────────────────────────────────────────────────

  describe('googleCallback', () => {
    it('should redirect to configured frontend URL with token params', async () => {
      const mockResult = {
        token: 'jwt-token-abc',
        user: { name: 'John Doe', email: 'john@test.com', role: 'EMPLOYEE', id: 'user1' },
      };
      mockAuthService.loginWithGoogle.mockResolvedValue(mockResult);
      mockConfigService.get.mockReturnValue('http://localhost:8888');

      const mockRes = { redirect: jest.fn() };
      await controller.googleCallback({ user: { googleId: 'g-123' } }, mockRes as any);

      expect(authService.loginWithGoogle).toHaveBeenCalledWith({ googleId: 'g-123' });
      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8888/oauth/callback'),
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('token=jwt-token-abc'));
      expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('role=EMPLOYEE'));
    });

    it('should fall back to http://localhost:8888 when FRONTEND_URL is not set', async () => {
      const mockResult = {
        token: 'jwt-token-xyz',
        user: { name: 'Jane', email: 'jane@test.com', role: 'HR', id: 'user2' },
      };
      mockAuthService.loginWithGoogle.mockResolvedValue(mockResult);
      mockConfigService.get.mockReturnValue(undefined);

      const mockRes = { redirect: jest.fn() };
      await controller.googleCallback({ user: {} }, mockRes as any);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8888/oauth/callback'),
      );
    });

    it('should include all user params in redirect URL', async () => {
      const mockResult = {
        token: 'tok',
        user: { name: 'Alice', email: 'alice@corp.com', role: 'MANAGER', id: 'mgr1' },
      };
      mockAuthService.loginWithGoogle.mockResolvedValue(mockResult);
      mockConfigService.get.mockReturnValue('https://app.example.com');

      const mockRes = { redirect: jest.fn() };
      await controller.googleCallback({ user: { sub: 'alice' } }, mockRes as any);

      const redirectUrl: string = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('name=Alice');
      expect(redirectUrl).toContain('email=alice%40corp.com');
      expect(redirectUrl).toContain('role=MANAGER');
      expect(redirectUrl).toContain('id=mgr1');
    });
  });
});
