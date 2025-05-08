// DW - Database utility

import { Kysely, MysqlDialect } from 'kysely';
import mysql from 'mysql2';
import { dbConfig } from '@/config/app';
import type { Database } from '@/config/schema';

// Create a regular pool first
const connectionPool = mysql.createPool({
  host: import.meta.env.MYSQL_HOST as string,
  user: import.meta.env.MYSQL_USER as string,
  password: import.meta.env.MYSQL_PASSWORD as string || '',
  database: import.meta.env.MYSQL_DATABASE as string,
  // Better Auth uses the datetime columns
  dateStrings: false,
  // Connection pool settings from centralized config
  ...dbConfig.pool
});

// Convert to promise pool
export const pool = connectionPool.promise();

// Create and export a Kysely instance using the shared pool
export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: connectionPool
  })
}); 