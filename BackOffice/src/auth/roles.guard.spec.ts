import { RolesGuard, ROLES_KEY } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function makeContext(userRole: string | null, requiredRoles?: string[]) {
    const handler = jest.fn();
    if (requiredRoles !== undefined) {
      Reflect.defineMetadata(ROLES_KEY, requiredRoles, handler);
    }
    return {
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ user: userRole ? { role: userRole } : null }),
      }),
    } as any;
  }

  it('should allow when no roles are required', () => {
    expect(guard.canActivate(makeContext('EMPLOYEE'))).toBe(true);
  });

  it('should allow when user has the required role', () => {
    expect(guard.canActivate(makeContext('SUPERADMIN', ['SUPERADMIN', 'HR']))).toBe(true);
  });

  it('should throw ForbiddenException when user is null', () => {
    expect(() => guard.canActivate(makeContext(null, ['SUPERADMIN']))).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user role is not allowed', () => {
    expect(() => guard.canActivate(makeContext('EMPLOYEE', ['SUPERADMIN', 'HR']))).toThrow(ForbiddenException);
  });

  it('should allow HR role when HR is in required roles', () => {
    expect(guard.canActivate(makeContext('HR', ['HR']))).toBe(true);
  });
});
