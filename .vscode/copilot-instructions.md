# Community Project Lab — Copilot Instructions

## Project Overview
A collaborative web platform for students to post community problems, vote, comment, generate AI insights, build proposals, and track projects. Building as a 14-day MVP.

## Tech Stack
- **Framework**: Next.js 14 (App Router only — never use pages/)
- **Language**: TypeScript (strict — never use `any`)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: OpenAI API (gpt-4o-mini)
- **Deployment**: Vercel

## Design Style
Modern, clean, minimal, student-friendly. Inspired by Notion, Linear, and Slack. Always responsive.

---

## Current Progress (Day 8 of 14)

### Completed
- Day 1: Next.js + Tailwind setup, folder structure, Git
- Day 2: Landing page
- Day 3: Dashboard layout, sidebar, routing
- Day 4: Supabase integration, authentication, database
- Day 5: Problem Board UI
- Day 6: Problem creation form, save to database
- Day 7: Problem detail page, voting system, comment system

### In Progress
- Day 8: AI Insight Summary (OpenAI integration)

### Upcoming
- Day 9: Proposal Builder UI
- Day 10: Proposal Save + Edit
- Day 11: Leader Review Dashboard (Approve / Revise / Reject)
- Day 12: Project Workspace (task list, progress, members)
- Day 13: Archive Library
- Day 14: Polish + Deploy

---

## Database Schema (Supabase / PostgreSQL)

### problems
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | |
| description | text | |
| category | text | |
| priority | text | low / medium / high |
| user_id | uuid | FK → users.id |
| created_at | timestamptz | |
| ai_summary | text | JSON string, nullable |
| ai_generated_at | timestamptz | nullable |

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | |
| full_name | text | |

### problem_votes
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| problem_id | uuid | FK → problems.id (cascade delete) |
| user_id | uuid | FK → users.id |
| created_at | timestamptz | |

### problem_comments
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| problem_id | uuid | FK → problems.id (cascade delete) |
| user_id | uuid | FK → users.id |
| content | text | |
| created_at | timestamptz | |

---

## Folder Structure
```
/app               → Next.js App Router pages and API routes
/components        → Reusable React components (PascalCase)
/lib               → Supabase clients, utility functions
/hooks             → Custom React hooks (useXxx)
/types             → TypeScript type definitions
/utils             → Helper functions
```

---

## Naming Conventions
- Components: `PascalCase` (e.g. `AIInsightCard.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g. `useAIInsight.ts`)
- Files: `kebab-case` or `PascalCase` consistently
- Variables: `camelCase`

---

## Core Development Rules

### Architecture
- Always use App Router — never `pages/`
- Separate Server Components and Client Components correctly
- Add `'use client'` only when needed (event handlers, hooks, state)
- Avoid hydration errors — don't access browser APIs during SSR

### TypeScript
- TypeScript everywhere — no `any` types ever
- Define interfaces in `/types`
- Use proper async/await with error handling

### Supabase
- Use `supabase-server.ts` for Server Components
- Use `supabase.ts` (browser client) for Client Components
- Always handle auth state — check user before writes
- Prevent duplicate inserts
- Handle errors gracefully with try/catch

### UI / Components
- Use shadcn/ui components whenever possible
- Keep components small and focused
- Always show loading states (skeletons preferred over spinners)
- Always handle empty states
- Always handle error states
- Make UI responsive (mobile-first)

### Code Quality
- No duplicated logic — extract to hooks or utils
- No deeply nested components — split when needed
- No overengineering — this is an MVP, keep it simple
- Readable and maintainable over clever

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```
Never hardcode these values. Always use `process.env`.

---

## AI Integration Rules (Day 8+)
- Only call OpenAI when user explicitly triggers it (button click)
- Always cache AI results in Supabase — never regenerate if summary exists
- Use `gpt-4o-mini` model for cost efficiency
- Use `response_format: { type: "json_object" }` for structured output
- Handle OpenAI errors gracefully — show user-friendly error messages
- Only authenticated users can trigger AI generation
