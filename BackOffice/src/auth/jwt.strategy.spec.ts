import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('should validate and return user payload', async () => {
    const payload = { sub: 'user123', email: 'john@example.com', role: 'EMPLOYEE' };
    const result = await strategy.validate(payload);

    expect(result).toEqual({
      sub: 'user123',
      email: 'john@example.com',
      role: 'EMPLOYEE',
    });
  });
});
