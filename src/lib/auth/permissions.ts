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

// Helper to check if user owns a resource
export async function checkOwnership(
  userId: string,
  uuid: string,
  table: keyof Database,
  database: Kysely<Database>
): Promise<boolean> {
  const config = OWNERSHIP_CONFIGS[table];
  if (!config) {
    throw new Error(`No ownership configuration found for table: ${table}`);
  }

  if (config.type === 'direct' && config.directField) {
    // Check direct ownership (e.g., ranches)
    const record = await database
      .selectFrom(table)
      .select(config.directField)
      .where('uuid', '=', uuid)
      .executeTakeFirst();

    return record?.[config.directField] === userId;
  } else if (config.type === 'relationship' && config.relationshipTable && config.relationshipField && config.relationshipOwnerField) {
    // Check relationship ownership (e.g., horses)
    const record = await database
      .selectFrom(config.relationshipTable)
      .select(config.relationshipOwnerField as keyof Database[typeof config.relationshipTable])
      .where(config.relationshipField as any, '=', uuid)
      .where(config.relationshipOwnerField as any, '=', userId)
      .executeTakeFirst();

    return !!record;
  }

  return false;
}

// Helper to check authorization with ownership
export async function checkAuthorizationWithOwnership(
  userId: string,
  authRoles: string[],
  uuid: string | null,
  table: string,
  requireOwnership: boolean,
  database: Kysely<Database>
): Promise<{ error: string } | null> {
  
  // For new records, just check create permission
  if (!uuid) {
    const createPermission = `create:${table}` as Permission;
    
    if (!hasPermission(authRoles, createPermission)) {
      return { error: 'Insufficient permissions to create' };
    }
    return null;
  }

  // For existing records, check ownership if required
  if (requireOwnership) {
    // Check if user owns the record or has admin permission
    const isOwner = await checkOwnership(userId, uuid, table as keyof Database, database);
    if (!isOwner && !hasPermission(authRoles, `update:any:${table}` as Permission)) {
      return { error: 'Not authorized to modify this record' };
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

  // For new records, check create permission
  if (!uuid) {
    const createPermission = `create:${resourceType}` as Permission;
    return hasPermission(locals.authRoles, createPermission);
  }

  // Check if user has admin permission to update any records of this type
  const hasAdminPermission = hasPermission(locals.authRoles, `update:any:${resourceType}` as Permission);
  if (hasAdminPermission) {
    return true;
  }

  // Check if user has permission to update their own records of this type
  const hasOwnPermission = hasPermission(locals.authRoles, `update:own:${resourceType}` as Permission);
  
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