# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository profile
- Stack: React + TypeScript + Vite, Tailwind CSS, shadcn/ui (Radix primitives), TanStack Query, Supabase (Database/Auth/Edge Functions)
- Package manager: npm (package-lock.json present). A bun.lockb exists, but scripts are defined for npm.
- Dev server: Vite on http://localhost:8080 (see vite.config.ts)

Common commands
- Install deps
  - npm install
- Start dev server (hot reload on port 8080)
  - npm run dev
- Build for production
  - npm run build
- Preview the production build locally
  - npm run preview
- Lint (TypeScript/React)
  - npm run lint
- Tests
  - No test runner is configured (no Jest/Vitest present). There is no "test" script in package.json.

Project architecture (big picture)
- Entry and routing
  - index.html mounts the app at #root and loads src/main.tsx, which renders <App />.
  - src/App.tsx wires global providers and routing:
    - QueryClientProvider (TanStack Query) for data fetching/caching.
    - AuthProvider (Supabase auth session for general users).
    - StaffAuthProvider (custom staff portal auth using a Supabase table + localStorage).
    - BrowserRouter with routes for Index, Auth, Dashboard, and role-specific portals: /admin, /secretary, /coordinator, /auditor, plus common pages (terms, privacy, etc.).
- UI system
  - Tailwind CSS configured in tailwind.config.ts with extensive theme tokens (colors, gradients, animations) and content globs for pages/components/src.
  - shadcn/ui-style components live under src/components/ui (accordion, dialog, form, input, table, toast, etc.). A small utility cn() is in src/lib/utils.ts.
- State and data
  - TanStack Query is initialized in App.tsx for async data flows.
  - Path alias @ points to ./src (configured in tsconfig and vite resolve.alias). Imports use '@/...'.
- Authentication and authorization
  - Supabase user auth: src/hooks/useAuth.tsx listens to supabase.auth state; exposes user/session/signOut.
  - Staff portal auth: src/hooks/useStaffAuth.tsx authenticates against the staff_registrations table and persists a lightweight staff user in localStorage.
  - Role-based access guard: src/hooks/useRoleGuard.tsx maps roles (Admin, Treasurer, Secretary, Coordinator, Auditor) to portal routes and redirects unauthorized users. A super admin email is whitelisted.
- Supabase integration
  - Client: src/integrations/supabase/client.ts creates a Supabase browser client using project URL and anon key, with persisted sessions. Types are generated in src/integrations/supabase/types.ts.
  - Database usage: pages/components call supabase.from(...).select/insert/update for tables such as membership_registrations, contributions, disbursements, member_balances, documents, etc.
  - Edge Functions (Deno): located under supabase/functions/* with config in supabase/config.toml. Used for:
    - mpesa-stk-push: invoked via supabase.functions.invoke in MPESAPayment.tsx.
    - export-excel and export-members/treasurer reports: invoked via supabase.functions.invoke or direct fetch to functions/v1 endpoints to generate downloadable CSV/Excel.
  - SQL migrations live under supabase/migrations. Additional one-off SQL files exist in repo (e.g., setup-member-deletion-constraints.sql, src/pages/*.sql) to support data setup.

Conventions and tooling notes
- Vite config (vite.config.ts)
  - server.host is "::" and server.port is 8080; alias '@' resolves to ./src.
- Linting (eslint.config.js)
  - Uses @eslint/js + typescript-eslint with React Hooks and React Refresh plugins; dist is ignored.
- Styling
  - Tailwind + autoprefixer configured via postcss.config.js; design tokens set in tailwind.config.ts.
- Environment
  - A .env file exists at repo root. Vite exposes env variables via import.meta.env if they are prefixed as needed (not defined here). Supabase client currently reads constants from the generated client file.

What’s not configured
- Testing: there is no Jest/Vitest configuration or test script. If tests are added later, include how to run the test suite and a single test here.
