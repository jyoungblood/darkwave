// Auth role and permission configuration

import type { Database } from '@/config/schema';

// Define our role types based on the database roles
export type Role = 'admin' | 'moderator' | 'contributor' | 'user';

// Define permission types
export type Permission = 
  | 'create:ranches'
  | 'update:own:ranches'
  | 'update:any:ranches'
  | 'delete:own:ranches'
  | 'delete:any:ranches'

  | 'create:horses'
  | 'update:own:horses'
  | 'update:any:horses'
  | 'delete:own:horses'
  | 'delete:any:horses'

  | 'create:listings'
  | 'update:own:listings'
  | 'update:any:listings'
  | 'delete:own:listings'
  | 'delete:any:listings'

  | 'create:news'
  | 'update:own:news'
  | 'update:any:news'
  | 'delete:own:news'
  | 'delete:any:news'

  | 'create:professionals'  
  | 'update:own:professionals'
  | 'update:any:professionals'
  | 'delete:own:professionals'
  | 'delete:any:professionals'

  | 'create:calendar'
  | 'update:own:calendar'
  | 'update:any:calendar'
  | 'delete:own:calendar'
  | 'delete:any:calendar'

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
export type OwnershipType = 'direct' | 'relationship';

// Define ownership configuration for different tables
export interface OwnershipConfig<T extends keyof Database = keyof Database> {
  type: OwnershipType;
  // For direct ownership (e.g., ranches)
  directField?: keyof Database[T];
  // For relationship ownership (e.g., horses)
  relationshipTable?: keyof Database;
  relationshipField?: string;
  relationshipOwnerField?: string;
}

// Ownership configurations for different tables
export const OWNERSHIP_CONFIGS: {
  [K in keyof Database]?: OwnershipConfig<K>
} = {
  ranches: {
    type: 'direct',
    directField: 'user_id'
  },
  listings: {
    type: 'direct',
    directField: 'user_id'
  },
  news: {
    type: 'direct',
    directField: 'user_id'
  },
  professionals: {
    type: 'direct',
    directField: 'user_id'
  },
  calendar: {
    type: 'direct',
    directField: 'user_id'
  },
  links: {
    type: 'direct',
    directField: 'user_id'
  },
  horses: {
    type: 'relationship',
    relationshipTable: 'rel_horses_users',
    relationshipField: 'horse_id',
    relationshipOwnerField: 'user_id'
  }
};

// Define role-permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'update:any:ranches',
    'delete:any:ranches',
    'update:any:horses',
    'delete:any:horses',
    'update:any:listings',
    'delete:any:listings',
    'update:any:news',
    'delete:any:news',
    'update:any:professionals',
    'delete:any:professionals',
    'update:any:calendar',
    'delete:any:calendar',
    'update:any:links',
    'delete:any:links',
    'update:any:users'
  ],
  moderator: [
    // 'update:any:ranches',

  ],
  contributor: [

  ],
  user: [
    'create:ranches',
    'update:own:ranches',
    'delete:own:ranches',
    'create:horses',
    'update:own:horses',
    'delete:own:horses',
    'create:listings',
    'update:own:listings',
    'delete:own:listings',
    'create:news',
    'update:own:news',
    'delete:own:news',
    'create:professionals',
    'update:own:professionals',
    'delete:own:professionals',
    'create:calendar',
    'update:own:calendar',
    'delete:own:calendar',
    'create:links',
    'update:own:links',
    'delete:own:links',
    'update:own:users',
  ]
};
