// Auth role and permission configuration

import type { Database } from '@/config/schema';

// Define our role types based on the database roles
export type Role = 'admin' | 'moderator' | 'contributor' | 'user';

// Define permission types
export type Permission = 

  | 'create:links'
  | 'update:own:links'
  | 'update:any:links'
  | 'delete:own:links'
  | 'delete:any:links'

  | 'create:users'
  | 'update:own:users'
  | 'update:any:users'
  | 'delete:own:users'
  | 'delete:any:users'
  ;

// Define ownership types
export type OwnershipType = 'direct' | 'relationship' | 'custom';

// Define ownership configuration for different tables
export interface OwnershipConfig<T extends keyof Database = keyof Database> {
  type: OwnershipType;
  // For direct ownership (e.g., ranches)
  directField?: keyof Database[T];
  // For relationship ownership (e.g., horses)
  relationshipTable?: keyof Database;
  relationshipField?: string;
  relationshipOwnerField?: string;
  relationshipRole?: string | string[]; // Optional role check for relationship ownership (single role or array of roles)
  groupRoles?: string | string[]; // Roles that grant ownership access (e.g., admin, medications_moderator) - if user has one of these roles, they are considered an owner
  customCheck?: (params: { // For custom ownership checks (e.g., projects with organization fallback)
    userId: string;
    idValue: string;
    idColumn: string;
    database: import('kysely').Kysely<Database>;
  }) => Promise<boolean>;
}

// Ownership configurations for different tables
export const OWNERSHIP_CONFIGS: {
  [K in keyof Database]?: OwnershipConfig<K>
} = {

  links: {
    type: 'direct',
    directField: 'user_id'
    // group EX:
    // groupRoles: ['admin', 'medications_moderator']
  },

  user: {
    type: 'direct',
    directField: 'id'
  },

};

// Define role-permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'update:any:links',
    'delete:any:links',
    'update:any:users'
  ],
  moderator: [
    // 'update:any:links',

  ],
  contributor: [

  ],
  user: [
    'create:links',
    'update:own:links',
    'delete:own:links',
    'update:own:users',
  ]
};
