// DW - Auth - Role management

import { db } from '@/lib/db';

// Role cache implementation
interface CachedRoles {
  roles: string[];
  expiresAt: number;
  version: number;
}

const roleCache = new Map<string, CachedRoles>();
let globalRoleVersion = 0;

/**
 * Gets user roles from database
 */
export async function getUserRoles(userId: string) {
  try {
    const roles = await db
      .selectFrom('rel_users_roles')
      .innerJoin('auth_roles', 'auth_roles.id', 'rel_users_roles.role_id')
      .where('rel_users_roles.user_id', '=', userId)
      .select(['auth_roles.id', 'auth_roles.name', 'auth_roles.description'])
      .execute();
    
    return roles;
  } catch (err) {
    console.error('Error fetching user roles:', err);
    return [];
  }
}

/**
 * Clears the role cache for a specific user or all users
 * @param userId Optional user ID to clear cache for specific user
 * @returns The new global role version number
 */
export function clearRoleCache(userId?: string): number {
  globalRoleVersion++;
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
  return globalRoleVersion;
}

/**
 * Gets the current global role version
 */
export function getGlobalRoleVersion(): number {
  return globalRoleVersion;
}

/**
 * Gets cached roles for a user
 */
export function getCachedRoles(userId: string): CachedRoles | undefined {
  return roleCache.get(userId);
}

/**
 * Sets cached roles for a user
 */
export function setCachedRoles(userId: string, roles: string[]): void {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
  roleCache.set(userId, {
    roles,
    expiresAt,
    version: globalRoleVersion
  });
}

/**
 * Verifies user roles against database and cache
 */
export async function verifyUserRoles(userId: string, options?: { forceFresh?: boolean }) {
  try {
    // Check cache first if not forcing fresh
    if (!options?.forceFresh) {
      const cached = getCachedRoles(userId);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          roles: cached.roles,
          version: cached.version
        };
      }
    }

    // Fetch from database if cache miss or force fresh
    const roleData = await getUserRoles(userId);
    const roles = roleData.map(role => role.name as string);
    
    // Cache the roles
    setCachedRoles(userId, roles);
    
    return {
      roles,
      version: getGlobalRoleVersion()
    };
  } catch (error) {
    console.error('❌ Database role fetch failed:', error);
    return {
      roles: [],
      version: getGlobalRoleVersion()
    };
  }
}
