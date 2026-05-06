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

  // Quand la route n'a pas de décorateur @Roles(), l'accès est libre quel que soit le rôle de l'utilisateur
  it('should allow when no roles are required', () => {
    expect(guard.canActivate(makeContext('EMPLOYEE'))).toBe(true);
  });

  // SUPERADMIN passe la vérification quand SUPERADMIN et HR sont tous les deux autorisés
  it('should allow when user has the required role', () => {
    expect(guard.canActivate(makeContext('SUPERADMIN', ['SUPERADMIN', 'HR']))).toBe(true);
  });

  // Les requêtes non authentifiées (pas de JWT / user null) doivent être bloquées par ForbiddenException
  it('should throw ForbiddenException when user is null', () => {
    expect(() => guard.canActivate(makeContext(null, ['SUPERADMIN']))).toThrow(ForbiddenException);
  });

  // EMPLOYEE doit être bloqué sur une route réservée à SUPERADMIN même s'il est authentifié
  it('should throw ForbiddenException when user role is not allowed', () => {
    expect(() => guard.canActivate(makeContext('EMPLOYEE', ['SUPERADMIN', 'HR']))).toThrow(ForbiddenException);
  });

  // Le rôle HR est correctement reconnu dans une liste de rôles autorisés à un seul élément
  it('should allow HR role when HR is in required roles', () => {
    expect(guard.canActivate(makeContext('HR', ['HR']))).toBe(true);
  });
});
