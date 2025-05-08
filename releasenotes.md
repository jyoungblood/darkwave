Everything's different, but we're still solving the same problems...now better than ever! This would be a new major version jump if we were past 1.0 but we're not, so it's not.

TL;DR — DW is now built on [Astro](https://astro.build)! Slim (and Stereo before that) has been great, but there's SO much I've been missing by staying out of JS ecosystem. The landscape has changed and things that used to be difficult are much easier now. The big things we get from the new architecture:

- Real components! - and because it's Astro, we can use ANY components
- [TailwindCSS](https://tailwindcss.com/) & [FlyonUI](https://flyonui.com/)
- First-class local development experience (big fan of HMR now)
- SSR w/ [Node.js](https://nodejs.org/) - faster and more efficient backend processing, and Node apps are SO much easier to deploy now
- More robust boilerplate written in [TypeScript](https://www.typescriptlang.org/)
- [Better-auth](https://github.com/astro-community/better-auth) - auth system written by someone smarter than me, with support for social logins (OAuth)
- [NPM](https://www.npmjs.com/) package integration for all dependencies

I've spent A LOT of time building new and more robust components for photo uploads (both single photo and multiple/gallery...with cropping!), input and form validation, alert notifications, and more. Plus we've got significantly improved authentication middleware (with RBAC configuration), pre-configured CSP, CSRF protection, cdn integration ([Bunny](https://bunny.net/)), preconfigured [nodemailer](https://nodemailer.com/) with SMTP and email templating with [MJML](https://mjml.io/)...oh yeah, and there's a nice collection of .cursorrules too!

I'm really hyped about Astro, I've been using it for the last year and it's brought a lot of joy into my life. 20-something years in the web development game and I've never been this happy with any framework or dev tool...and they just keep making it better!

More big plans for the future, as usual, but this is a giant leap in the right direction.

BTW I made a branch with the latest PHP-based version in case anyone feels nostalgic at any point: [DW-SLIME](https://github.com/jyoungblood/darkwave/tree/slime)
