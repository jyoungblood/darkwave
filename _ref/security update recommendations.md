# Security Update Recommendations

## Security Issues in MJML Dependencies

### 1. html-minifier Vulnerability (Dependabot #3)

**Issue Links**
- [Dependabot Alert #3](https://github.com/jyoungblood/darkwave/security/dependabot/3)
- [MJML Issue #2589](https://github.com/mjmlio/mjml/issues/2589)

### Issue
The project has a transitive dependency on `html-minifier@4.0.0` through MJML (specifically `mjml-cli` and `mjml-core`). This version has a high-severity Regular Expression Denial of Service (ReDoS) vulnerability.

**Important Context:** 
- MJML 5.0 (currently in alpha) replaces html-minifier with a different solution
- The vulnerability only affects server-side MJML usage
- MJML team has confirmed this is a breaking change and won't be backported to 4.x

### Current Implementation
- MJML version: 4.15.3
- html-minifier version: 4.0.0
- Dependency path:
  1. `mjml -> mjml-cli -> html-minifier@4.0.0`
  2. `mjml -> mjml-core -> html-minifier@4.0.0`

### Recommended Actions (In Order of Priority)

1. **Immediate Mitigation**
   - Disable HTML minification in MJML by setting the minify option to false
   - This completely avoids the vulnerable code path
   - Example configuration:
     ```javascript
     mjml2html(template, { minify: false })
     ```

2. **Short-term: Upgrade to MJML 5.0 Alpha**
   - MJML 5.0.0-alpha.6 or later contains the fix
   - Note: This is a breaking change as minification becomes async
   - Installation:
     ```bash
     npm install mjml@5.0.0-alpha.6
     ```

3. **Long-term Planning**
   - Monitor MJML 5.0 stable release progress
   - Plan for the async minification changes in the codebase
   - Consider implementing additional input validation for email templates

### Modern Email Template Alternatives

If considering alternatives to MJML, here are some current options to evaluate:

1. **[React Email](https://react.email)**
   - Modern, React-based email framework
   - TypeScript support
   - Components-first approach
   - Active development and community
   - No HTML minification vulnerabilities
   - Limitations: Newer project, less battle-tested than MJML

2. **[Foundation for Emails](https://get.foundation/emails)**
   - Mature, stable platform
   - Grid system similar to MJML
   - Sass workflow
   - Limitations: Less modern development experience

3. **[Maizzle](https://maizzle.com)**
   - Build process for email templates
   - TailwindCSS integration
   - Modern development workflow
   - Strong focus on production optimization
   - Limitations: Steeper learning curve

4. **[Unlayer](https://unlayer.com)**
   - Modern drag-and-drop editor
   - API-first approach
   - Hosted solution
   - Limitations: Commercial product, less control

### Additional Resources
- [React Email GitHub Repository](https://github.com/resend/react-email)
- [Maizzle Documentation](https://maizzle.com/docs/introduction)
- [Foundation for Emails Documentation](https://get.foundation/emails/docs/)
- [Unlayer API Documentation](https://docs.unlayer.com/)

### Considerations When Evaluating Alternatives

1. **Migration Effort**
   - Template conversion complexity
   - Development team familiarity
   - Testing requirements

2. **Feature Parity**
   - Responsive design support
   - Component reusability
   - Build process integration
   - Email client compatibility

3. **Maintenance Requirements**
   - Community size and activity
   - Documentation quality
   - Security track record
   - Dependency health

### Notes
- The package override approach previously suggested is not recommended anymore
- The vulnerability only impacts server-side template processing
- MJML 5.0 stable is pending resolution of [issue #2919](https://github.com/mjmlio/mjml/issues/2919)
- If using the alpha version, thoroughly test email template rendering
- Document any changes to minification settings in your deployment docs

### 2. js-beautify Vulnerability (Dependabot #4)

**Issue Links**
- [Dependabot Alert #4](https://github.com/jyoungblood/darkwave/security/dependabot/4)
- [MJML PR #2858](https://github.com/mjmlio/mjml/pull/2858) (fixes both issues)

**Issue**
- The project has another transitive dependency through MJML on `js-beautify`
- Dependency paths:
  1. `mjml -> mjml-cli -> js-beautify`
  2. `mjml -> mjml-core -> js-beautify`
  3. `mjml -> mjml-migrate -> js-beautify`

**Status**
- Both this and the html-minifier issue are addressed in MJML 5.0
- Same resolution path as html-minifier issue
- Part of the same breaking changes in MJML 5.0

**Combined Resolution Steps**

1. **Immediate Mitigation**
   - Disable both minification and beautification in MJML
   - Example configuration:
     ```javascript
     mjml2html(template, { 
       minify: false,
       beautify: false 
     })
     ```

2. **Recommended Solution**
   - Upgrade to MJML 5.0.0-alpha.6 or later
   - This addresses both security issues simultaneously
   - Installation:
     ```bash
     npm install mjml@5.0.0-alpha.6
     ```

3. **Implementation Notes**
   - Both fixes are included in the same MJML update
   - The change to async processing affects both features
   - Testing should cover both minification and beautification scenarios

### React Email Integration with Astro

If choosing React Email as an MJML alternative, here are the available integration options:

1. **[astro-email](https://github.com/emailsapp/astro-email)**
   - Official Astro integration for React Email
   - Simple setup with Astro's integration system
   - Example configuration:
     ```javascript
     // astro.config.mjs
     import { defineConfig } from "astro/config";
     import email from "astro-email";
     
     export default defineConfig({
       integrations: [
         email({
           filename: "[name].html",
         }),
       ],
     });
     ```

2. **[Netlify's Example](https://github.com/netlify/email-astro-resend-example)**
   - Complete example using React Email with Resend
   - Includes development setup with Ethereal for testing
   - Production-ready configuration
   - Includes proper environment variable handling

3. **Key Benefits Over MJML**
   - Modern React-based components
   - TypeScript support out of the box
   - No known security vulnerabilities
   - Active development and maintenance
   - Better developer experience with modern tooling
   - Simpler testing workflow

4. **Implementation Example**
   ```astro
   ---
   export const partial = true;
   import * as React from "react";
   import { Body, Container, Heading } from "@react-email/components";
   import Mail from "astro-email/Mail.astro";
   ---
   <Mail>
     <Body style={{ fontFamily: "system-ui", margin: "0" }}>
       <Container>
         <Heading>My Email Template</Heading>
       </Container>
     </Body>
   </Mail>
   ```

### Maizzle Integration with Astro

For projects currently using MJML, [Maizzle](https://maizzle.com) offers a familiar template-based approach with modern tooling:

1. **Key Benefits Over MJML**
   - Tailwind CSS for email styling
   - Similar template-based approach to MJML
   - No security vulnerabilities
   - Built-in email compatibility transformations
   - Simpler migration path from MJML
   - Active development and maintenance

2. **Migration Example**
   From MJML:
   ```typescript
   // Current MJML template
   export function createEmailTemplate(data: EmailData) {
     return `
       <mjml>
         <mj-body>
           <mj-section>
             <mj-column>
               <mj-text>
                 <p>From: ${data.name}</p>
               </mj-text>
             </mj-column>
           </mj-section>
         </mj-body>
       </mjml>
     `;
   }
   ```

   To Maizzle:
   ```typescript
   // New Maizzle template
   export function createEmailTemplate(data: EmailData) {
     return `
       ---
       title: "Contact Form"
       ---
       <x-main>
         <div class="max-w-600 mx-auto p-24">
           <p class="text-gray-800 mb-16">
             From: ${data.name}
           </p>
         </div>
       </x-main>
     `;
   }
   ```

3. **Integration with Astro**
   ```typescript
   // src/lib/email.ts
   import { build } from '@maizzle/framework'

   export async function renderEmail(template: string, data: any) {
     const config = {
       tailwind: {
         config: require('../maizzle.config.js'),
       },
       build: {
         templates: {
           source: template,
         },
       },
     }
     
     const { html } = await build(config)
     return html
   }
   ```

4. **Template Preview in Admin**
   ```astro
   ---
   // src/pages/admin/email-preview.astro
   import AdminLayout from "@/layouts/AdminLayout.astro";
   import { renderEmail } from "@/lib/email";
   import { createEmailTemplate } from "@/email-templates/main";

   const previewData = {
     name: "John Doe",
     email: "john@example.com",
   };

   const template = createEmailTemplate(previewData);
   const html = await renderEmail(template, previewData);
   ---

   <AdminLayout title="Email Preview">
     <div class="email-preview">
       <div class="preview-container" set:html={html} />
     </div>
   </AdminLayout>
   ```

5. **Configuration (maizzle.config.js)**
   ```javascript
   module.exports = {
     build: {
       templates: {
         source: 'src/templates',
         destination: {
           path: 'build_email',
         },
       },
     },
     tailwind: {
       config: {
         theme: {
           extend: {
             spacing: {
               'screen': '100vw',
             },
           },
         },
       },
     },
   }
   ```

6. **Benefits for Current Setup**
   - Minimal changes needed to existing email utility
   - Templates can be migrated gradually
   - Familiar template literal syntax
   - Built-in email client compatibility
   - TypeScript support
   - Tailwind CSS for consistent styling
