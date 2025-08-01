import { Kysely, sql, ColumnDefinitionBuilder } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create links table
  await db.schema
    .createTable('links')
    .addColumn('id', 'integer', (col: ColumnDefinitionBuilder) => col.primaryKey().autoIncrement())
    .addColumn('uuid', 'varchar(255)', (col: ColumnDefinitionBuilder) => col.notNull())
    .addColumn('created_at', 'timestamp', (col: ColumnDefinitionBuilder) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('approved_at', 'timestamp')
    .addColumn('user_id', 'varchar(255)', (col: ColumnDefinitionBuilder) => col.references('user.id').onDelete('set null'))
    .addColumn('title', 'varchar(255)')
    .addColumn('url', 'varchar(255)')
    .addColumn('description', 'text')
    .addColumn('type', 'varchar(255)')
    .addColumn('deleted_at', 'timestamp')
    .addColumn('photo_url', 'varchar(255)')
    .addColumn('slug', 'varchar(255)')
    .addColumn('updated_at', 'timestamp')
    .addColumn('photo_url_parameters', 'text')
    .execute();

  // Create gallery_content table
  await db.schema
    .createTable('gallery_content')
    .addColumn('id', 'integer', (col: ColumnDefinitionBuilder) => col.primaryKey().autoIncrement())
    .addColumn('uuid', 'varchar(255)', (col: ColumnDefinitionBuilder) => col.notNull())
    .addColumn('created_at', 'timestamp', (col: ColumnDefinitionBuilder) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp')
    .addColumn('photo_url', 'varchar(255)')
    .addColumn('gallery_type', 'varchar(255)')
    .addColumn('display_order', 'integer')
    .addColumn('title', 'varchar(255)')
    .addColumn('description', 'text')
    .addColumn('related_id', 'varchar(255)')
    .addColumn('related_table', 'varchar(255)')
    .addColumn('user_id', 'varchar(255)', (col: ColumnDefinitionBuilder) => col.references('user.id').onDelete('set null'))
    .addColumn('photo_url_parameters', 'text')
    .execute();

  // Create auth_roles table
  await db.schema
    .createTable('auth_roles')
    .addColumn('id', 'integer', (col: ColumnDefinitionBuilder) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', (col: ColumnDefinitionBuilder) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamp', (col: ColumnDefinitionBuilder) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Insert default roles from SQL
  await db
    .insertInto('auth_roles')
    .values([
      { id: 1, name: 'admin', description: 'Full system access' },
      { id: 2, name: 'moderator', description: 'Can moderate content' },
      { id: 3, name: 'contributor', description: 'Can contribute content' },
      { id: 4, name: 'banned', description: 'Banned user' }
    ])
    .execute();
    
  // Create rel_users_roles table
  await db.schema
    .createTable('rel_users_roles')
    .addColumn('user_id', 'varchar(255)', (col: ColumnDefinitionBuilder) => col.references('user.id').onDelete('cascade').notNull())
    .addColumn('role_id', 'integer', (col: ColumnDefinitionBuilder) => col.references('auth_roles.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', (col: ColumnDefinitionBuilder) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint('rel_users_roles_pk', ['user_id', 'role_id'])
    .execute();

  // Add indexes
  await db.schema
    .createIndex('links_user_id_index')
    .on('links')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('gallery_content_user_id_index')
    .on('gallery_content')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('rel_users_roles_user_id_index')
    .on('rel_users_roles')
    .columns(['user_id', 'role_id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('rel_users_roles').ifExists().execute();
  await db.schema.dropTable('auth_roles').ifExists().execute();
  await db.schema.dropTable('gallery_content').ifExists().execute();
  await db.schema.dropTable('links').ifExists().execute();
} 