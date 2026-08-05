import { APIGatewayProxyEvent } from 'aws-lambda';

export type Role = 'admin' | 'operator' | 'viewer';

export interface AuthContext {
  userId: string;
  role: Role;
  departmentId?: string;
}

export const ROLE_PERMISSIONS: Record<Role, Set<string>> = {
  admin: new Set([
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'departments:read',
    'departments:create',
    'departments:update',
    'departments:delete',
    'reports:read',
    'reports:create',
    'reports:update',
    'reports:delete',
    'sendhistory:read',
    'sendhistory:create',
    'sendhistory:update',
    'sendhistory:delete',
    'emaillog:read',
    'emaillog:create',
    'emaillog:update',
    'emaillog:delete',
    'bulk:write',
    'audit:read',
  ]),
  operator: new Set([
    'users:read',
    'users:create',
    'users:update',
    'departments:read',
    'departments:create',
    'departments:update',
    'reports:read',
    'reports:create',
    'reports:update',
    'sendhistory:read',
    'sendhistory:create',
    'sendhistory:update',
    'emaillog:read',
    'emaillog:create',
    'emaillog:update',
    'bulk:write',
    'audit:read',
  ]),
  viewer: new Set([
    'users:read',
    'departments:read',
    'reports:read',
    'sendhistory:read',
    'emaillog:read',
    'audit:read',
  ]),
};

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers?.Authorization || event.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return {
      userId: decoded.userId || 'unknown',
      role: (decoded.role || 'viewer') as Role,
      departmentId: decoded.departmentId,
    };
  } catch {
    return {
      userId: 'unknown',
      role: 'viewer',
    };
  }
}

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function requirePermission(role: Role, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Permission denied: ${permission}`);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}