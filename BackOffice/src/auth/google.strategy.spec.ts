import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/shemas/user.shema';

// Mock passport-google-oauth20 Strategy to avoid real OAuth config
jest.mock('passport-google-oauth20', () => ({
  Strategy: class {
    constructor(_options: any, verify: any) {
      this._verify = verify;
    }
    _verify: any;
  },
}));

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let userModel: any;

  const mockUser = {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'EMPLOYEE',
    mustChangePassword: false,
  };

  const mockUserModel = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    userModel = module.get(getModelToken(User.name));

    jest.clearAllMocks();
  });

  it('should call done with user when email exists and mustChangePassword is false', async () => {
    mockUserModel.findOne.mockResolvedValue(mockUser);
    const done = jest.fn();
    const profile = { emails: [{ value: 'john@example.com' }] };

    await strategy.validate('accessToken', 'refreshToken', profile, done);

    expect(done).toHaveBeenCalledWith(null, mockUser);
  });

  it('should call done with UnauthorizedException when no email in profile', async () => {
    const done = jest.fn();
    const profile = { emails: [] };

    await strategy.validate('accessToken', 'refreshToken', profile, done);

    expect(done).toHaveBeenCalledWith(expect.any(UnauthorizedException), false);
  });

  it('should call done with UnauthorizedException when user not found', async () => {
    mockUserModel.findOne.mockResolvedValue(null);
    const done = jest.fn();
    const profile = { emails: [{ value: 'unknown@example.com' }] };

    await strategy.validate('accessToken', 'refreshToken', profile, done);

    expect(done).toHaveBeenCalledWith(expect.any(UnauthorizedException), false);
  });

  it('should call done with UnauthorizedException when mustChangePassword is true', async () => {
    mockUserModel.findOne.mockResolvedValue({ ...mockUser, mustChangePassword: true });
    const done = jest.fn();
    const profile = { emails: [{ value: 'john@example.com' }] };

    await strategy.validate('accessToken', 'refreshToken', profile, done);

    expect(done).toHaveBeenCalledWith(expect.any(UnauthorizedException), false);
  });
});
