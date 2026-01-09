// DW - Auth - Permissions utilities

import type { Database } from '@/config/schema';
import type { Permission, Role } from '@/config/auth';
import { ROLE_PERMISSIONS, OWNERSHIP_CONFIGS } from '@/config/auth';
import type { Kysely } from 'kysely';
import { db } from '@/lib/db';

// Extend Astro's Locals type with only what we need
declare namespace App {
  interface Locals {
    userId?: string;
    authRoles?: string[];
  }
}

// Define our API context type
export interface AuthAPIContext {
  request: Request;
  cookies: import('astro').AstroCookies;
  locals: App.Locals;
}


// Helper to check if user has a specific permission
export function hasPermission(authRoles: string[], permission: Permission): boolean {
  
  // Check if user has any of the roles that grant this permission
  const hasPermission = authRoles.some(role => {
    const rolePerms = ROLE_PERMISSIONS[role as Role];
    
    // If the role doesn't exist in ROLE_PERMISSIONS, return false
    if (!rolePerms) {
      return false;
    }
    
    // Check if the permission exists in the role's permissions
    const hasPerm = rolePerms.includes(permission);
    return hasPerm;
  });
  
  return hasPermission;
}

// Helper to parse related_id (string or JSON object) into column and value
export function parseRelatedId(relatedId: string): { column: string; value: string } {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(relatedId);
    // If it's an object with a single key-value pair
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      if (keys.length === 1) {
        return { column: keys[0], value: String(parsed[keys[0]]) };
      }
    }
  } catch {
    // Not JSON, treat as string (default to 'uuid' column)
  }
  // Default behavior: treat as string and use 'uuid' column
  return { column: 'uuid', value: relatedId };
}

// Helper to check if user owns a resource
export async function checkOwnership(
  userId: string,
  idValue: string,
  table: keyof Database,
  database: Kysely<Database>,
  idColumn: string = 'uuid',
  authRoles?: string[]
): Promise<boolean> {
  const config = OWNERSHIP_CONFIGS[table];
  if (!config) {
    throw new Error(`No ownership configuration found for table: ${table}`);
  }

  // Handle custom ownership checks
  if (config.type === 'custom' && config.customCheck) {
    return await config.customCheck({
      userId,
      idValue,
      idColumn,
      database
    });
  }

  // Check if user has a group role that grants ownership access
  if (config.groupRoles && authRoles) {
    const groupRoles = Array.isArray(config.groupRoles) ? config.groupRoles : [config.groupRoles];
    if (authRoles.some(role => groupRoles.includes(role))) {
      return true;
    }
  }

  if (config.type === 'direct' && config.directField) {
    // Check direct ownership (e.g., ranches)
    const record = await database
      .selectFrom(table)
      .select(config.directField)
      .where(idColumn as any, '=', idValue)
      .executeTakeFirst();

    return record?.[config.directField] === userId;
  } else if (config.type === 'relationship' && config.relationshipTable && config.relationshipField && config.relationshipOwnerField) {
    // Check relationship ownership (e.g., horses, organizations)
    let query = database
      .selectFrom(config.relationshipTable)
      .select(config.relationshipOwnerField as keyof Database[typeof config.relationshipTable])
      .where(config.relationshipField as any, '=', idValue)
      .where(config.relationshipOwnerField as any, '=', userId);
    
    // If a role is specified, also check for that role (supports single role or array of roles)
    if (config.relationshipRole) {
      if (Array.isArray(config.relationshipRole)) {
        query = query.where('role' as any, 'in', config.relationshipRole) as any;
      } else {
        query = query.where('role' as any, '=', config.relationshipRole) as any;
      }
    }
    
    const record = await query.executeTakeFirst();

    return !!record;
  }

  return false;
}

// Helper to normalize table name for permission checks
// Maps database table names to permission names (handles singular/plural differences)
function normalizeTableForPermission(table: string): string {
  // Map singular table names to their plural permission names
  const tableToPermissionMap: Record<string, string> = {
    'user': 'users',
  };
  
  return tableToPermissionMap[table] || table;
}

// Helper to check authorization with ownership
export async function checkAuthorizationWithOwnership(
  userId: string,
  authRoles: string[],
  idValue: string | null,
  table: string,
  requireOwnership: boolean,
  database: Kysely<Database>,
  idColumn: string = 'uuid'
): Promise<{ error: string } | null> {
  
  // For new records, just check create permission
  if (!idValue) {
    const permissionTable = normalizeTableForPermission(table);
    const createPermission = `create:${permissionTable}` as Permission;
    
    if (!hasPermission(authRoles, createPermission)) {
      return { error: 'Insufficient permissions to create' };
    }
    return null;
  }

  // For existing records, check ownership if required
  if (requireOwnership) {
    // Check if user owns the record or has admin permission
    const isOwner = await checkOwnership(userId, idValue, table as keyof Database, database, idColumn, authRoles);
    if (!isOwner) {
      // Normalize table name for permission check (e.g., "user" -> "users")
      const permissionTable = normalizeTableForPermission(table);
      if (!hasPermission(authRoles, `update:any:${permissionTable}` as Permission)) {
        return { error: 'Not authorized to modify this record' };
      }
    }
  }

  return null;
}

// Authorization middleware factory
export function requirePermission(permission: Permission) {
  return async (context: AuthAPIContext) => {
    const { locals } = context;
    
    // Check if user is authenticated
    if (!locals.userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has the required permission
    if (!locals.authRoles || !hasPermission(locals.authRoles, permission)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return null; // Continue to next middleware/handler
  };
}

interface CanEditOptions {
  locals: App.Locals;
  resourceType: string;
  uuid?: string | null;
  ownerId?: string | null;
}

export async function canEdit(options: CanEditOptions): Promise<boolean> {
  const { locals, resourceType, uuid = null } = options;
  
  // If no user is logged in, they can't edit
  if (!locals.userId || !locals.authRoles || locals.authRoles.length === 0) {
    return false;
  }

  // Normalize resource type for permission checks
  const permissionResourceType = normalizeTableForPermission(resourceType);

  // For new records, check create permission
  if (!uuid) {
    const createPermission = `create:${permissionResourceType}` as Permission;
    return hasPermission(locals.authRoles, createPermission);
  }

  // Check if user has admin permission to update any records of this type
  const hasAdminPermission = hasPermission(locals.authRoles, `update:any:${permissionResourceType}` as Permission);
  if (hasAdminPermission) {
    return true;
  }

  // Check if user has permission to update their own records of this type
  const hasOwnPermission = hasPermission(locals.authRoles, `update:own:${permissionResourceType}` as Permission);
  
  // If user doesn't have permission to edit their own content, they can't edit regardless of ownership
  if (!hasOwnPermission) {
    return false;
  }

  // Now that we've confirmed they have permission to edit their own content,
  // check if they are the owner of the record
  if (options.ownerId) {
    return locals.userId === options.ownerId;
  }

  // Check authorization with ownership, similar to the backend
  const authError = await checkAuthorizationWithOwnership(
    locals.userId,
    locals.authRoles,
    uuid,
    resourceType,
    true, // Always require ownership for non-admin users
    db
  );

  return authError === null;
}