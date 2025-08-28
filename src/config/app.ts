// App configuration

// Route Configuration
export const managedRoutes = {
  protected: ['/dashboard', '/links/edit/*', '/links/new'],
  admin: ['/admin', '/admin/*'],
  redirect: ['/login', '/register'],
  bypass: ['/feed/*'],
} as const;

// Database Configuration
export const dbConfig = {
  pool: {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
    maxIdle: 10,
  },
} as const;

// Email Configuration
export const emailConfig = {
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT),
  secure: import.meta.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
} as const;

// File Upload Configuration
// export const uploadConfig = {
//   maxFilesize: 10, // MB
//   maxFiles: 10,
//   acceptedFiles: '.jpg,.jpeg,.png,.gif',
//   thumbnailSize: {
//     width: 120,
//     height: 120,
//   },
//   timeout: 180000, // 3 minutes
//   parallelUploads: 3,
// } as const;

// Security Configuration
// export const securityConfig = {
//   csrf: {
//     cookieOptions: {
//       path: "/",
//       sameSite: "lax",
//       secure: import.meta.env.PROD,
//       httpOnly: true,
//       maxAge: 31536000 // 1 year
//     }
//   },
// } as const;

// UI Configuration
// export const uiConfig = {
//   alert: {
//     defaultDuration: 5000,
//     defaultPosition: 'top-right',
//   },
// } as const; 