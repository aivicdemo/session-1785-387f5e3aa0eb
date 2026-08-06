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
    'submission_history:read',
    'submission_history:create',
    'submission_history:update',
    'submission_history:delete',
    'email_logs:read',
    'email_logs:create',
    'email_logs:update',
    'email_logs:delete',
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
    'submission_history:read',
    'submission_history:create',
    'submission_history:update',
    'email_logs:read',
    'email_logs:create',
    'email_logs:update',
    'bulk:import',
    'audit:read',
  ]),
  viewer: new Set([
    'users:read',
    'departments:read',
    'reports:read',
    'submission_history:read',
    'email_logs:read',
    'audit:read',
  ]),
};

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers['Authorization'] || event.headers['authorization'];
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid Authorization header format');
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return {
      userId: payload.userId,
      role: payload.role as Role,
      departmentId: payload.departmentId,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function hasPermission(auth: AuthContext, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[auth.role];
  return permissions.has(permission);
}

export function requirePermission(auth: AuthContext, permission: string): void {
  if (!hasPermission(auth, permission)) {
    throw new Error(`Forbidden: ${permission}`);
  }
}