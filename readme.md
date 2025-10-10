# ▲▼ D A R K W A V E

### Web application development kit

Darkwave is a "batteries-included" tool kit for building data-driven web applications with Astro. 

We've curated a selection of reliable and approachable tools to create a professional-grade full-stack boilerplate with pre-wired functionality and components for common SaaS and CRUD features.

DW facilitates a hyper-productive development workflow, helping developers focus on delivering real value with ease.


Read the full documentation and user guide at [darkwavejs.com](https://darkwavejs.com/)


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

### Application Boilerplate
- Global middleware
- Configuration management
- DB schema & migrations
- RBAC authentication rules
- Authentication flows (register, login, fogot pw)
- Extendable admin app with user management

### Utilities
- UI & form components
- Full-stack photo upload solution!
- CRUD abstractions, CSRF validation
- Storage adapters for uploaded media
- Programmatic email
- Misc helper functions
- CLI utilities




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

Initialize the database (and optionally create admin user)
```bash
npm run init
```

Start development server
```bash
npm run dev
```

Refer to the [documentation](https://darkwavejs.com/) for next steps.




## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## * . · : · . ☽ ✧ 
- [DW Classic](https://github.com/jyoungblood/darkwave/tree/slime) - legacy PHP-based version