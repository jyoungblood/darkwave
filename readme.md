# ▲▼ D A R K W A V E

### Web application development kit

Darkwave is a "batteries-included" tool kit for building data-driven web applications with Astro. 

We've curated a selection of reliable and approachable tools to create a professional-grade full-stack boilerplate with pre-wired functionality and components for common SaaS and CRUD features.

DW facilitates a hyper-productive development workflow, helping developers focus on delivering real value with ease.


Read the full documentation and user guide at [darkwave.ltd](https://darkwave.ltd/)


## What's Included?

### Core Stack

- [Astro](https://astro.build) (SSR w/ Node.js adapter)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) with [FlyonUI](https://flyonui.com/)
- [Better-Auth](https://www.better-auth.com/) for authentication
- [MySQL](https://www.mysql.com/) (8.0) with [Kysely](https://kysely.dev/) query builder & cli

### Additional Utilities

- [Alpine.js](https://alpinejs.dev/) - JavaScript framework for enhanced interactivity
- [HTMX](https://htmx.org/) - Modern approach to dynamic content without writing JavaScript
- [Cropper.js](https://fengyuanchen.github.io/cropperjs/) - Image cropping library
- [Dropzone](https://www.dropzone.dev/) - Drag & drop file upload interface
- [SortableJS](https://sortablejs.github.io/Sortable/) - Drag & drop sorting library
- [Validator.js](https://github.com/validatorjs/validator.js) - String validation
- [Iconify](https://iconify.design/) - Icon framework with Tabler icons set



## Core Philosophy

- Security and performance as top priorities
- Professional, maintainable solutions without unnecessary complexity
- Code that is easy to understand and maintain over clever solutions
- Proven, stable patterns over bleeding-edge features
- Long-term maintainability and reliability
- Pragmatic solutions using "boring" techniques


## Features

### Infrastructure

- Server-side rendering with Astro and Node.js adapter
- TypeScript support with enhanced type safety
- Tailwind CSS with FlyonUI theme integration
- Better-Auth authentication system with role-based access control and OAuth configured with Google login
- MySQL database integration with Kysely query builder
- Comprehensive security configurations (CSP, CSRF protection)

### Form Components

- Text input fields with validation
- Single and gallery photo upload with cropping
- Select dropdown
- Checkbox group
- Submit and delete buttons with form validation
- Textarea inputs

### UI Components

- Configurable alert system
- Modal dialogs
- Button links


### Backend Architecture

- JWT-based authentication middleware
- Secure cookie handling
- Role-based authorization system
- CSRF protection middleware
- Email notifications TSX components
- File upload handling with image processing (integrated with bunny.net cdn & image processor)
- Configurable environment variables
- Database schema management

### Developer Ergonomics

- Alias imports (@/ path resolution)
- Organized project structure
- Type definitions for enhanced IDE support
- Development mode conveniences (local cookie handling)
- Clear coding standards and best practices



## Getting Started

Clone the repository
```bash
npx degit jyoungblood/darkwave my-project
cd my-project
```

Install dependencies
```bash
npm install
```

Initialize your database and SMTP account, have the credentials ready to add to your new .env file.

Configure environment variables (add your database, mail server, etc)
```bash
mv .env.example .env
```

Generate [Better-Auth secret](https://www.better-auth.com/docs/installation) (save this to your .env file)
```bash
openssl rand -base64 32
```

Create the core database tables
```bash
npx @better-auth/cli migrate --config src/lib/auth/better.ts && npx kysely migrate:latest
```

Start development server
```bash
npm run dev
```

Refer to the [documentation](https://darkwave.ltd/) for next steps.


## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── admin/         # Admin components
│   ├── forms/         # Form-related components
│   └── ui/            # General UI components
├── config/            # Application configuration
├── email-templates/   # Email templates
├── layouts/           # Page layouts
├── lib/               # Shared utilities and helpers
├── middleware/        # Request middleware
├── pages/             # Application routes & templates
├── styles/            # Tailwind & FlyonUI integration, base component styles
```



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## * . · : · . ☽ ✧ 
- [DW Classic](https://github.com/jyoungblood/darkwave/tree/slime) - legacy PHP-based version