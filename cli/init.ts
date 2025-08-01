// DW - CLI script to run initialization for BA, create default DB tables, optionally create admin user 

import { betterAuth } from 'better-auth';
import mysql from 'mysql2';
import { Kysely, MysqlDialect, type InsertObject, type UpdateObject } from 'kysely';

import type { Database } from '../src/config/schema';
import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';
import * as readline from 'readline';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Simple toggle selector
const toggle = async (prompt: string): Promise<boolean> => {
  let selected = true;
  let key = '';

  // Enter raw mode to get keypress events
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdout.write('\x1b[?25l'); // Hide cursor

  const render = () => {
    process.stdout.write('\r\x1b[K'); // Clear line
    process.stdout.write(`${prompt} `);
    // Use background colors for selection
    process.stdout.write(selected 
      ? '\x1b[7m Yes \x1b[0m   No ' // Inverse video for Yes
      : ' Yes   \x1b[7m No \x1b[0m' // Inverse video for No
    );
  };

  render();

  try {
    return new Promise(resolve => {
      const handleData = (data: Buffer) => {
        key = data.toString();
        
        if (key === '\u001b[C' || key === '\u001b[D') { // Left/Right arrows
          selected = !selected;
          render();
        } else if (key === '\r') { // Enter
          process.stdin.removeListener('data', handleData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\x1b[?25h\n'); // Show cursor and newline
          resolve(selected);
        }
      };

      process.stdin.on('data', handleData);
    });
  } catch (error) {
    process.stdout.write('\x1b[?25h'); // Show cursor on error
    throw error;
  }
};

// Create a regular pool first
const connectionPool = mysql.createPool({
  host: process.env.MYSQL_HOST as string,
  user: process.env.MYSQL_USER as string,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE as string,
  dateStrings: false
});

// Convert to promise pool for Better-Auth
const pool = connectionPool.promise();

// Test database connection
pool.getConnection()
  .then((conn: any) => {
    // console.log('✅ Database connection successful');
    conn.release();
  })
  .catch((err: Error) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// Create Kysely instance
const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: connectionPool
  })
});

const execAsync = promisify(exec);

// Validate required environment variables
const requiredEnvVars = {
  'BETTER_AUTH_URL': process.env.BETTER_AUTH_URL,
  'BETTER_AUTH_SECRET': process.env.BETTER_AUTH_SECRET
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([name]) => name);

if (missingVars.length > 0) {
  console.error('❌ Error: The following environment variables must be set in your .env file:');
  missingVars.forEach(name => console.error(`  - ${name}`));
  process.exit(1);
}

// Create a minimal auth instance just for admin creation
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: '/api/auth/better',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: false,
  },
  database: pool,
  plugins: [],
});

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function createAdminUser(email: string, password: string, name: string) {
  try {
    // console.log('Creating user with Better-Auth...');
    // Create the user through Better-Auth with isAdminCreation flag
    const authResult = await auth.api.signUpEmail({
      headers: new Headers(),
      body: {
        email,
        password,
        name,
        metadata: {
          isAdminCreation: true
        }
      }
    } as any);

    // console.log('User created, got user ID:', authResult.user.id);
    const userId = authResult.user.id;

    // console.log('Marking email as verified...');
    try {
      // Update email verification status
      const updateResult = await db
        .updateTable('user')
        .set({ 
          emailVerified: true,
          updatedAt: new Date()
        } as UpdateObject<Database, 'user'>)
        .where('id', '=', userId)
        .execute();
      
      // console.log('Email verification update result:', updateResult);
      // console.log('Email marked as verified');
    } catch (error) {
      console.error('Failed to update email verification status:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
      }
      throw error;
    }

    // console.log('Assigning admin role...');
    try {
      // Insert admin role
      const insertResult = await db
        .insertInto('rel_users_roles')
        .values({
          user_id: userId,
          role_id: 1
        } as InsertObject<Database, 'rel_users_roles'>)
        .execute();
      
      // console.log('Role assignment result:', insertResult);
      // console.log('Admin role assigned');
    } catch (error) {
      console.error('Failed to assign admin role:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
      }
      throw error;
    }

    // console.log(`✅ Admin user created successfully: ${email}`);
    return {
      id: userId,
      email,
      name
    };
  } catch (error) {
    console.error('Failed to create admin user:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

async function promptForAdminCreation(): Promise<{ createAdmin: boolean; email?: string; password?: string; name?: string }> {
  try {
    const createAdmin = await toggle('Create admin user?');
    
    if (!createAdmin) {
      return { createAdmin: false };
    }

    let email: string;
    let password: string;
    let name: string;

    // Keep asking for email until a valid one is provided
    while (true) {
      email = await question('Enter admin email: ');
      if (isValidEmail(email)) {
        break;
      }
      console.error('❌ Invalid email format. Please try again.');
    }

    // Keep asking for password until a valid one is provided
    while (true) {
      password = await question('Enter admin password (minimum 8 characters): ');
      if (password.length >= 8) {
        break;
      }
      console.error('❌ Password must be at least 8 characters long. Please try again.');
    }

    name = await question('Enter admin name (press Enter for "Admin User"): ');
    if (!name.trim()) {
      name = 'Admin User';
    }

    return {
      createAdmin: true,
      email,
      password,
      name
    };
  } finally {
    // Clean up readline interface
    rl.close();
  }
}

async function init() {
  const options = await promptForAdminCreation();

    try {
      // Check if Better-Auth is already initialized
      const [rows] = await pool.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
        [process.env.MYSQL_DATABASE, 'user']
      );

      if (!(rows as any[]).length) {
        try {
          // console.log('\nInitializing Better-Auth...');
          await execAsync('npx @better-auth/cli migrate --config src/lib/auth/better.ts');
          console.log('✅ Better-Auth initialization completed');
        } catch (error) {
          console.error('Failed to run Better-Auth initialization:', error);
          process.exit(1);
        }
      }

      try {
      await execAsync('npm run migrate');
      console.log('\n✅ Initial migrations completed');
    } catch (error) {
      console.error('Failed to run initial migrations:', error);
      process.exit(1);
    }

    if (options.createAdmin) {
      // Create admin user
      // console.log('\nCreating admin user...');
      // These values are guaranteed to be defined by our prompt function
      const result = await createAdminUser(
        options.email as string,
        options.password as string,
        options.name as string
      );
      
      if (result) {
        console.log('\n✅ Setup completed successfully!');
        // console.log(`\nYou can now log in with:`);
        console.log(`\nAdmin user created: ${result.email}`);
        // console.log('Password: [the password you provided]');
      } else {
        console.error('\n❌ Setup failed');
        process.exit(1);
      }
    } else {
      console.log('\n✅ Setup completed successfully!');
    }
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.destroy();
    process.exit(0);
  }
}

init();