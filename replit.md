# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## CMS Module

### DB Tables
- `cms_sections` — key/value store for landing page section content (hero, stats, testimonials, FAQ, pricing, site_settings) stored as JSONB. Fallback to built-in defaults if no row exists.
- `cms_posts` — blog posts (title, slug, excerpt, content, coverImage, author, status, tags, publishedAt)

### API Routes (`/api/cms/...`) — all under `artifacts/api-server/src/routes/cms.ts`
- `GET /api/cms/sections` — public; returns all saved sections
- `PUT /api/cms/sections/:key` — admin only; upserts a section's JSON content
- `GET /api/cms/posts` — public (published only); pass `?all=true` with admin auth for all
- `GET /api/cms/posts/:slug` — public; single post by slug
- `POST /api/cms/posts` — admin only; create post
- `PUT /api/cms/posts/:id` — admin only; update post (auto-sets publishedAt when status→published)
- `DELETE /api/cms/posts/:id` — admin only

### SaaS Admin CMS UI (`artifacts/saas-admin/src/pages/cms/`)
- `/cms` — CMS overview dashboard (stats, recent posts, section status)
- `/cms/sections` — edit any landing page section's JSON inline (expand/collapse per section, reset to default)
- `/cms/posts` — blog post list (publish toggle, delete, search)
- `/cms/posts/new` or `/cms/posts/:id` — full post editor (title, slug, excerpt, markdown content, tags, cover image, status)

### Landing Page Blog (`artifacts/landing/src/pages/`)
- `/blog` — public blog listing (tag filter, search, card grid)
- `/blog/:slug` — public post detail (markdown rendered, share button, CTA footer)
- Navbar updated to include "Blog" link

## Assignment Links Feature

- **Admin**: Can attach reference links (e.g. Google Forms, docs) when creating or editing assignments — stored as `attachedLinks jsonb` on `assignmentsTable`
- **Students**: See admin's reference links on each assignment; can also submit their own links (e.g. Google Docs responses) alongside or instead of typed text — stored as `submissionLinks jsonb` on `assignmentSubmissionsTable`
- **Admin marking view**: Shows each student's submitted links as clickable entries alongside their written content
- Submission now requires *either* typed content *or* at least one link (no longer mandatory to type text)

## Quiz Feature (Admin LMS)

- Admin sidebar now has a **Quizzes** section at `/quizzes`
- DB tables: `quizzes` (title, description, passageText, parts jsonb, courseId, timeLimitMinutes, isPublished) and `quiz_questions` (quizId, type, order, questionText, options jsonb)
- API routes under `/api/quizzes` — CRUD for quizzes and questions
- 4 question types, each stored as jsonb in `options`:
  - `fill_blank`: `{ sentence, blanks[] }` — sentence with ___ placeholders, ordered correct answers
  - `dropdown`: `{ stem, choices[], correct }` — multiple-choice dropdown
  - `choose_word`: `{ instruction, wordLimit, passageText?, imageUrl?, correct }` — word from passage/picture
  - `matching`: `{ leftItems[], rightItems[], pairs[] }` — column matching pairs
- **Reading passage**: optional text shown on the left panel during student quiz-taking
- **Parts/groups**: admin can define question groups (e.g. Part 1: Q1–13, Part 2: Q14–26) stored as `parts: [{name, from, to}]` jsonb. Shown as dark red (bg-[#7F1D1D]) section labels in the quiz footer.
- Shared `PartsEditor` component: `artifacts/lms/src/components/quiz/parts-editor.tsx`

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/landing` (`@workspace/landing`)

Public-facing marketing landing page for OneSoft LMS. Served at path `/` (root domain). Single-page, no backend.
- 9-section scroll-worthy page: hero, social proof, methodology, IELTS bands, platform deep dive, tutors, testimonials, FAQ, CTA
- AI-generated product images, scroll-triggered animations via `use-scroll-reveal` hook
- Custom color palette: deep indigo + warm terracotta background
- Files: `src/pages/home.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`

### `artifacts/lms` (`@workspace/lms`)

Full-stack LMS (Learning Management System) React + Vite frontend. Contains both the admin dashboard and the student portal.
**Served at `/lms/` path (BASE_PATH=/lms/)** — moved from `/` to allow landing page at root.

**Admin area** (routes `/`, `/courses`, `/enrollments`, `/students`):
- Dashboard with stats and charts
- Course and lesson management (CRUD) with **Chapters** feature:
  - Chapters are ordered groups of lessons within a course
  - Admin can add/rename/delete chapters; lessons can be assigned to a chapter
  - Course detail page shows lessons grouped by chapter (collapsible sections)
  - Unassigned lessons appear in an "Unassigned Lessons" section
  - DB: `chapters` table (id, courseId, title, order, createdAt); `lessons.chapterId` nullable FK
  - API routes: `GET/POST /api/courses/:id/chapters`, `PUT/DELETE /api/courses/:id/chapters/:chapterId`
- Enrollment management
- Student directory with "View Enrollments" quick link

**Student Portal** (routes `/student`, `/student/*`):
- Login page at `/student` — email-based, no password (localStorage session)
- Dashboard at `/student/dashboard` — enrolled courses, upcoming deadlines, notifications
- My Courses at `/student/courses` — enrolled courses with progress + browse & enroll
- Course View at `/student/courses/:id` — lesson list with check-to-complete, discussion board
- Assignments at `/student/assignments` — pending/submitted assignments & quizzes
- Notifications at `/student/notifications` — mark read/mark all read
- Profile at `/student/profile` — edit name/bio/phone/city/lastQualification/whyIelts, view academic history

Context: `src/context/student-context.tsx` — manages localStorage session
Layouts: `src/components/layout/sidebar-layout.tsx` (admin), `src/components/layout/student-layout.tsx` (student)

### `lib/object-storage-web` (`@workspace/object-storage-web`)

Client-side React utility for file uploads via GCS presigned URLs. Exports:
- `useUpload(options)` — hook that performs the two-step presigned URL upload flow (request URL, PUT file to GCS). Returns `{ uploadFile, isUploading, error, progress }`.
- `ObjectUploader` — full Uppy-based drag-and-drop UI component (requires Uppy deps).

Used by: `@workspace/lms` quiz part editor for image/audio uploads.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
