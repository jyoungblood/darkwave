# CRITICAL: Answer questions, don't implement unless explicitly asked

When user asks a question: ANSWER it with information/explanation. DO NOT write code unless explicitly requested to implement.

---

# PROJECT

Stack: Astro (SSR), Tailwind CSS, TypeScript, Better-Auth, MySQL 8.0
See ./package.json and ./src/layouts/Layout.astro for libraries

---

# RULES

**Follow user instructions precisely** - No unrequested features/changes. Ask for clarification.

**Code modification:**
- Treat existing code as critical infrastructure
- Understand fully before modifying
- Make minimal, targeted changes
- Preserve edge cases and special handling
- Ask before modifying unclear code
- Default to additive changes

**Business logic:**
- Application layer only, NOT in database (no MySQL functions/triggers)

**Languages:**
- TypeScript: Astro components, backend functionality
- JavaScript: Frontend functionality (unless instructed otherwise)
- Prefer interfaces over types
- File structure: exports -> subcomponents -> helpers -> types

**Variables:**
- Use `let` for variables (even if not reassigned initially)
- Use `const` sparingly (NOT in loops)
- Use `var` only for globals needed outside function

**Tailwind:**
- Never use @apply directive
- Use utility classes directly

