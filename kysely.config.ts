import { MysqlDialect } from 'kysely';
import mysql from 'mysql2';

export default {
  dialect: new MysqlDialect({
    pool: mysql.createPool({
      host: process.env.MYSQL_HOST as string,
      user: process.env.MYSQL_USER as string,
      password: process.env.MYSQL_PASSWORD as string || '',
      database: process.env.MYSQL_DATABASE as string,
      dateStrings: false
    })
  }),
  migrations: {
    migrationsFolder: './migrations'
  }
} 