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
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'submissions:delete',
    'maillogs:read',
    'maillogs:create',
    'maillogs:update',
    'maillogs:delete',
    'bulk:import',
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
    'submissions:read',
    'submissions:create',
    'submissions:update',
    'maillogs:read',
    'maillogs:create',
    'bulk:import',
    'audit:read',
  ]),
  viewer: new Set([
    'users:read',
    'departments:read',
    'reports:read',
    'submissions:read',
    'maillogs:read',
    'audit:read',
  ]),
};

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'] || '';
  const match = authHeader.match(/Bearer\s+(.+)/);
  const token = match ? match[1] : '';

  const decoded = parseJwt(token);
  return {
    userId: decoded.userId || 'unknown',
    role: (decoded.role || 'viewer') as Role,
    departmentId: decoded.departmentId,
  };
}

export function hasPermission(context: AuthContext, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[context.role];
  return permissions.has(permission);
}

export function requirePermission(context: AuthContext, permission: string): void {
  if (!hasPermission(context, permission)) {
    throw new ForbiddenError(`Permission denied: ${permission}`);
  }
}

function parseJwt(token: string): Record<string, unknown> {
  if (!token) return {};
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return decoded;
  } catch {
    return {};
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