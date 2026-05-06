import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = { get: jest.fn().mockReturnValue('test_secret') } as any;
    strategy = new JwtStrategy(configService);
  });

  it('should validate and return user payload', () => {
    const payload = { sub: 'user1', email: 'test@test.com', role: 'HR' };
    expect(strategy.validate(payload)).toEqual({
      sub: 'user1',
      email: 'test@test.com',
      role: 'HR',
    });
  });

  it('should return all three fields from payload', () => {
    const result = strategy.validate({ sub: 'u2', email: 'a@b.com', role: 'EMPLOYEE' });
    expect(result).toHaveProperty('sub');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('role');
  });
});
