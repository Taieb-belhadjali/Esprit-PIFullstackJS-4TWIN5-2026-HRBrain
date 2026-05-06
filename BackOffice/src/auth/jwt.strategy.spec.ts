import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = { get: jest.fn().mockReturnValue('test_secret') } as any;
    strategy = new JwtStrategy(configService);
  });

  // validate() mappe les claims JWT vers request.user sans modification — les trois champs sont conservés tels quels
  it('should validate and return user payload', () => {
    const payload = { sub: 'user1', email: 'test@test.com', role: 'HR' };
    expect(strategy.validate(payload)).toEqual({
      sub: 'user1',
      email: 'test@test.com',
      role: 'HR',
    });
  });

  // Vérifie que sub, email et role sont tous présents dans le résultat — RolesGuard dépend de ces trois champs
  it('should return all three fields from payload', () => {
    const result = strategy.validate({ sub: 'u2', email: 'a@b.com', role: 'EMPLOYEE' });
    expect(result).toHaveProperty('sub');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('role');
  });
});
