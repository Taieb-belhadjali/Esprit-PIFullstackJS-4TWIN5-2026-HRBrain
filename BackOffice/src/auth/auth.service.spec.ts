import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User } from '../users/shemas/user.shema';

jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  const mockUser = {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: 'EMPLOYEE',
    mustChangePassword: false,
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return token and user info on valid credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login('john@example.com', 'password123');

      expect(result.token).toBe('mock.jwt.token');
      expect(result.mustChangePassword).toBe(false);
      expect(result.user.email).toBe('john@example.com');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login('unknown@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
       mockUserModel.findOne.mockResolvedValue(mockUser);
       bcrypt.compare.mockResolvedValue(false);

      await expect(service.login('john@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return mustChangePassword true when user must change password', async () => {
       const userMustChange = { ...mockUser, mustChangePassword: true };
       mockUserModel.findOne.mockResolvedValue(userMustChange);
       bcrypt.compare.mockResolvedValue(true);

      const result = await service.login('john@example.com', 'password123');

      expect(result.mustChangePassword).toBe(true);
    });
  });

  // ─── loginWithGoogle ──────────────────────────────────────────────────────────

  describe('loginWithGoogle', () => {
    it('should return token and user info', async () => {
      const result = await service.loginWithGoogle(mockUser);

      expect(result.token).toBe('mock.jwt.token');
      expect(result.mustChangePassword).toBe(false);
      expect(result.user.email).toBe('john@example.com');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('should update password and return success message', async () => {
       mockUserModel.findByIdAndUpdate.mockResolvedValue({});
       bcrypt.hash.mockResolvedValue('newHashedPassword');

      const result = await service.changePassword('user123', 'newPassword123');

      expect(result.message).toBe('Mot de passe mis à jour avec succès');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
        password: 'newHashedPassword',
        mustChangePassword: false,
      });
    });

    it('should throw BadRequestException when password is too short', async () => {
      await expect(service.changePassword('user123', '123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when password is empty', async () => {
      await expect(service.changePassword('user123', '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
