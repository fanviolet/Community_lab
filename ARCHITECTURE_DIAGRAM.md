# Community Project Lab - Architecture Diagram

## Overview

Community Project Lab is a Next.js 16.2.6 application with Supabase backend, designed for students to discover community problems, discuss solutions, build proposals with AI assistance, and implement real-world projects.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion 12
- **Theme**: next-themes (dark mode support)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (for avatars)

### Development
- **Package Manager**: npm
- **Linting**: ESLint 9
- **Compiler**: Babel with React Compiler

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Middleware Layer                        │  │
│  │  - Route protection (/dashboard, /workspace, etc.)       │  │
│  │  - Session management via Supabase                       │  │
│  │  - Auth redirects (login ↔ dashboard)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   App Router Pages                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Landing    │  │   Auth       │  │  Dashboard   │  │  │
│  │  │   (/)        │  │  (/login,    │  │  (/dashboard)│  │  │
│  │  │              │  │   /signup)   │  │              │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Problems    │  │  Proposals   │  │  Workspace   │  │  │
│  │  │  (/problems)│  │  (/proposals)│  │  (/workspace)│  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Components Layer                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Landing UI  │  │  Dashboard   │  │  Auth Forms  │  │  │
│  │  │  (Hero,      │  │  (Sidebar,   │  │  (Login,     │  │  │
│  │  │   Features)  │  │   Header)    │  │   Signup)    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Problem UI  │  │  Proposal UI │  │  Workspace   │  │  │
│  │  │  (Cards,     │  │  (Form,      │  │  (Tasks,     │  │  │
│  │  │   Filters)   │  │   Builder)   │  │   Members)   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Business Logic                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Server       │  │ Custom       │  │ Permission   │  │  │
│  │  │ Actions      │  │ Hooks        │  │ System       │  │  │
│  │  │ (projects.ts,│  │ (useAIInsight│  │ (leader/     │  │  │
│  │  │  proposals.ts│  │  useAutoSave,│  │  member)     │  │  │
│  │  │              │  │  useProposal)│  │              │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Data Access Layer                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Supabase     │  │ Supabase     │  │ Supabase     │  │  │
│  │  │ Browser      │  │ Server       │  │ Middleware   │  │  │
│  │  │ Client       │  │ Client       │  │ Helpers      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Authentication                          │  │
│  │  - Email/password auth                                    │  │
│  │  - Session management (cookies)                           │  │
│  │  - User profiles                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   PostgreSQL Database                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Problems    │  │  Proposals   │  │  Projects    │  │  │
│  │  │  (community  │  │  (project    │  │  (approved   │  │  │
│  │  │   issues)    │  │   proposals) │  │   proposals)│  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Tasks       │  │  Activities  │  │  Project_    │  │  │
│  │  │  (project    │  │  (activity   │  │  Members     │  │  │
│  │  │   tasks)     │  │   logs)      │  │  (team)      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐                      │  │
│  │  │  Problem_    │  │  Problem_    │  │                   │  │
│  │  │  Votes       │  │  Comments    │  │                   │  │
│  │  └──────────────┘  └──────────────┘  │                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Row Level Security (RLS)                │  │
│  │  - 19 policies protecting all tables                      │  │
│  │  - Role-based access (leader/member)                      │  │
│  │  - User-specific data isolation                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
community-project-lab/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Dashboard route group
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── problems/             # Problem board
│   │   │   ├── proposals/            # Proposal builder
│   │   │   ├── discussion/           # Discussion forum
│   │   │   ├── insights/             # AI insights
│   │   │   ├── review/               # Review dashboard
│   │   │   ├── workspace/            # Project workspace
│   │   │   └── archive/              # Archived items
│   │   ├── actions/                  # Server actions
│   │   │   ├── projects.ts           # Project mutations
│   │   │   └── proposals.ts          # Proposal mutations
│   │   ├── auth/                     # Auth callbacks
│   │   ├── login/                    # Login page
│   │   ├── signup/                   # Signup page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css              # Global styles
│   ├── components/                   # React components
│   │   ├── auth/                     # Auth components
│   │   ├── dashboard-header.tsx      # Dashboard header
│   │   ├── dashboard-sidebar.tsx     # Dashboard sidebar
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── problems/                 # Problem components
│   │   ├── proposals/                # Proposal components
│   │   ├── workspace/                # Workspace components
│   │   └── [landing components]      # Hero, Features, etc.
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAIInsight.ts           # AI insight hook
│   │   ├── useAutoSave.ts            # Auto-save hook
│   │   └── useProposalForm.ts        # Proposal form hook
│   ├── lib/                          # Utilities
│   │   ├── supabase.ts               # Browser client
│   │   ├── supabase-server.ts        # Server client
│   │   ├── supabase-middleware.ts    # Middleware helpers
│   │   ├── permissions.ts            # Permission system
│   │   ├── dashboard-nav.ts          # Navigation config
│   │   └── utils.ts                  # General utilities
│   ├── types/                        # TypeScript types
│   │   ├── problem.ts                # Problem types
│   │   ├── proposal.ts               # Proposal types
│   │   ├── comment.ts                # Comment types
│   │   └── ai-insight.ts             # AI insight types
│   └── middleware.ts                 # Next.js middleware
├── supabase/                         # Database migrations
│   ├── 0001_add_owner_id_to_projects.sql
│   ├── 0002_workspace_schema.sql
│   └── RLS_POLICIES.sql              # Row Level Security
├── public/                          # Static assets
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
└── tailwind.config.ts               # Tailwind config
```

---

## Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                        profiles                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ email (text)                                                    │
│ full_name (text)                                                │
│ avatar_url (text)                                               │
│ created_at (timestamptz)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        problems                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ title (text)                                                    │
│ description (text)                                              │
│ tag (text) - Education, Environment, Community, Technology      │
│ priority (text) - Low, Medium, High                            │
│ votes (integer)                                                 │
│ comments (integer)                                              │
│ created_at (timestamptz)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              │ 1:N                           │ 1:N
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    problem_votes        │     │    problem_comments     │
├─────────────────────────┤     ├─────────────────────────┤
│ problem_id (FK)         │     │ problem_id (FK)         │
│ user_id (FK)            │     │ user_id (FK)            │
│ created_at              │     │ content (text)          │
└─────────────────────────┘     │ created_at              │
                                └─────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        proposals                                 │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ problem_id (uuid, FK)                                           │
│ user_id (uuid, FK)                                              │
│ title (text)                                                    │
│ overview (text)                                                 │
│ goals (jsonb)                                                   │
│ timeline (text)                                                 │
│ team_notes (text)                                               │
│ status (text) - draft, submitted, approved, rejected, revise   │
│ created_at (timestamptz)                                        │
│ updated_at (timestamptz)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:1 (when approved)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        projects                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ proposal_id (uuid, FK, nullable)                                │
│ title (text)                                                    │
│ description (text)                                              │
│ status (text) - active, archived                                │
│ start_date (date)                                               │
│ end_date (date)                                                 │
│ created_at (timestamptz)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              │ 1:N                           │ 1:N
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    project_members       │     │        tasks            │
├─────────────────────────┤     ├─────────────────────────┤
│ project_id (FK)         │     │ project_id (FK)         │
│ user_id (FK)            │     │ title (text)            │
│ role (text)             │     │ description (text)      │
│   - leader, member      │     │ status (text)            │
│ name (text)             │     │   - todo, in_progress,  │
│ email (text)            │     │     completed           │
│ avatar_url (text)       │     │ priority (text)          │
│ created_at              │     │   - low, medium, high    │
└─────────────────────────┘     │ assigned_to (FK)         │
                                │ due_date (date)          │
                                │ created_at               │
                                │ updated_at               │
                                └─────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        activities                                │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ project_id (uuid, FK)                                           │
│ user_id (uuid, FK)                                              │
│ user_name (text)                                                │
│ action (text) - task_created, task_completed, member_added     │
│ description (text)                                               │
│ metadata (jsonb)                                                │
│ created_at (timestamptz)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow Diagram

### Problem Discovery to Project Implementation

```
┌──────────────┐
│   Landing    │
│    Page      │
└──────┬───────┘
       │
       │ Browse Problems
       ▼
┌──────────────┐
│  Problem     │
│    Board     │
└──────┬───────┘
       │
       │ Submit Problem
       ▼
┌──────────────┐
│  Create      │
│  Problem     │
└──────┬───────┘
       │
       │ Vote/Comment
       ▼
┌──────────────┐
│  Discussion  │
│   Forum      │
└──────┬───────┘
       │
       │ Build Proposal
       ▼
┌──────────────┐
│  Proposal    │
│   Builder    │
│  (with AI)   │
└──────┬───────┘
       │
       │ Submit for Review
       ▼
┌──────────────┐
│   Review     │
│  Dashboard   │
└──────┬───────┘
       │
       │ Approve
       ▼
┌──────────────┐
│   Project    │
│   Created    │
└──────┬───────┘
       │
       │ Manage in Workspace
       ▼
┌──────────────┐
│  Workspace   │
│  - Tasks     │
│  - Members   │
│  - Activity  │
└──────────────┘
```

---

## Authentication Flow

```
┌──────────────┐
│   User       │
│  Browser     │
└──────┬───────┘
       │
       │ Navigate to /login
       ▼
┌──────────────┐
│  Login Page  │
└──────┬───────┘
       │
       │ Submit Credentials
       ▼
┌──────────────┐
│ Supabase Auth│
│  (Server)    │
└──────┬───────┘
       │
       │ Auth Success
       ▼
┌──────────────┐
│  Session     │
│  Cookie Set  │
└──────┬───────┘
       │
       │ Middleware Check
       ▼
┌──────────────┐
│  Protected   │
│   Routes     │
│  (/dashboard)│
└──────────────┘
```

---

## Permission System

### Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                        Permission Matrix                         │
├──────────────────┬──────────────┬──────────────┬────────────────┤
│     Action       │    Leader    │   Member     │  Non-Member    │
├──────────────────┼──────────────┼──────────────┼────────────────┤
│ View Project     │      ✓       │      ✓       │        ✗       │
│ Edit Project     │      ✓       │      ✗       │        ✗       │
│ Archive Project  │      ✓       │      ✗       │        ✗       │
│ Manage Members   │      ✓       │      ✗       │        ✗       │
│ Create Tasks     │      ✓       │      ✓       │        ✗       │
│ Edit Own Tasks   │      ✓       │      ✓       │        ✗       │
│ Edit All Tasks   │      ✓       │      ✗       │        ✗       │
│ Delete Tasks     │      ✓       │      ✗       │        ✗       │
│ Update Status    │      ✓       │      ✓*       │        ✗       │
│ View Activity    │      ✓       │      ✓       │        ✗       │
└──────────────────┴──────────────┴──────────────┴────────────────┘
* Only for tasks assigned to the member
```

### Permission Check Flow

```
┌──────────────┐
│   User       │
│  Request     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Get User    │
│  Role from   │
│project_members│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Create       │
│ Permission   │
│  Context     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Check        │
│ Specific     │
│ Permission   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Allow/Deny   │
│  Action      │
└──────────────┘
```

---

## Key Features

### 1. Problem Discovery
- Browse community problems by category
- Vote on problems to prioritize
- Comment and discuss problems
- Filter by tag (Education, Environment, Community, Technology)
- Filter by priority (Low, Medium, High)

### 2. Proposal Builder
- Create proposals from problems
- AI-assisted proposal generation
- Define goals, timeline, and team notes
- Draft → Submit → Review → Approve workflow
- Auto-save functionality

### 3. Project Workspace
- Convert approved proposals to projects
- Create and assign tasks
- Track task status (todo, in_progress, completed)
- Manage team members (leader/member roles)
- Activity logging for transparency

### 4. AI Insights
- Generate AI-powered insights on problems
- Assist in proposal creation
- Provide recommendations

### 5. Discussion Forum
- Comment on problems
- Threaded discussions
- Real-time updates

---

## Security Architecture

### Row Level Security (RLS)

The application uses 19 RLS policies to protect data:

1. **Projects** (3 policies)
   - INSERT: Leaders can create projects
   - UPDATE: Leaders can edit projects
   - DELETE: Leaders can delete projects

2. **Project Members** (4 policies)
   - INSERT: Leaders can add members
   - SELECT: Members can view team
   - UPDATE: Leaders can change roles
   - DELETE: Leaders can remove members

3. **Tasks** (5 policies)
   - INSERT: Members can create tasks
   - SELECT: Members can view tasks
   - UPDATE: Leaders can edit all, members can edit own
   - DELETE: Only leaders can delete
   - Status update: Assignee can update status

4. **Activities** (3 policies)
   - INSERT: Members can log activities
   - SELECT: Members can view activities
   - UPDATE: Restricted

5. **Proposals** (4 policies)
   - INSERT: Authenticated users can create
   - SELECT: Users can view own proposals
   - UPDATE: Users can edit own proposals
   - DELETE: Users can delete own proposals

### Middleware Protection

```
Protected Routes:
- /dashboard/*
- /discussion/*
- /insights/*
- /proposals/*
- /workspace/*
- /archive/*

Auth Routes:
- /login
- /signup

Middleware Logic:
1. Check if Supabase configured
2. Update session
3. Redirect unauthenticated users to /login
4. Redirect authenticated users from /login to /dashboard
```

---

## Data Flow Examples

### Creating a Project from Proposal

```
1. User submits proposal
   ↓
2. Proposal status: "submitted"
   ↓
3. Admin reviews in Review Dashboard
   ↓
4. Admin clicks "Approve"
   ↓
5. Server action: createProjectFromProposal()
   ↓
6. Update proposal status to "approved"
   ↓
7. Create project record
   ↓
8. Add proposal author as project leader
   ↓
9. Log activity in activities table
   ↓
10. Revalidate /review and /dashboard/workspace
   ↓
11. Redirect to workspace
```

### Creating a Task

```
1. User navigates to project workspace
   ↓
2. Click "Add Task"
   ↓
3. Fill task form (title, description, assignee, due_date)
   ↓
4. Submit form
   ↓
5. Server action validates permissions
   ↓
6. Check: is user a member?
   ↓
7. Insert task into tasks table
   ↓
8. Log activity: "task_created"
   ↓
9. Revalidate workspace page
   ↓
10. Update UI with new task
```

---

## API Endpoints

### Server Actions (Internal)

- `createProject(formData)` - Create new project
- `createProjectFromProposal(proposalId)` - Convert proposal to project
- `getUserProposals()` - Get user's proposals
- `getProposalById(id)` - Get specific proposal
- `updateProposal(formData)` - Update proposal

### Supabase Queries

All data access goes through Supabase client:
- Browser client for client-side queries
- Server client for server-side queries
- Middleware helpers for session management

---

## State Management

### Client-Side State
- React hooks for form state
- Custom hooks for complex logic
- Auto-save with debouncing

### Server-Side State
- Server actions for mutations
- Supabase queries for data fetching
- Revalidation for cache updates

### Session State
- Supabase auth session in cookies
- Middleware for session validation
- Server/client clients for auth checks

---

## Performance Optimizations

1. **Database Indexes**
   - Tasks: project_id, assigned_to, status, priority, due_date
   - Activities: project_id, created_at, user_id
   - Project Members: project_id, user_id

2. **Parallel Queries**
   - Dashboard stats fetched in parallel using Promise.all()

3. **Lazy Loading**
   - Supabase browser client is lazy-loaded
   - Components use code splitting

4. **Cache Revalidation**
   - Targeted revalidation after mutations
   - Only affected paths are revalidated

---

## Deployment Considerations

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

### Build Process
- `npm run build` - Production build
- `npm start` - Production server
- `npm run dev` - Development server

### Database Setup
1. Run `supabase/0002_workspace_schema.sql`
2. Run `supabase/RLS_POLICIES.sql`
3. Verify RLS policies are active

---

## Future Enhancements

1. **Real-time Updates**
   - Use Supabase Realtime for live updates
   - WebSocket connections for collaborative editing

2. **File Uploads**
   - Upload project documents
   - Store in Supabase Storage

3. **Advanced AI Features**
   - More sophisticated AI insights
   - Auto-generated task breakdowns
   - Risk assessment

4. **Analytics**
   - Project progress tracking
   - Team performance metrics
   - Community impact statistics

5. **Notifications**
   - Email notifications for proposals
   - In-app notifications for task assignments
   - Activity feed subscriptions

---

## Summary

Community Project Lab is a well-architected Next.js application with:

- **Modern Stack**: Next.js 16, TypeScript, Tailwind CSS, Supabase
- **Secure**: RLS policies, middleware protection, role-based permissions
- **Scalable**: Indexed database, parallel queries, cache revalidation
- **User-Friendly**: AI assistance, auto-save, intuitive UI
- **Community-Driven**: Problem discovery, discussion, collaboration

The application follows best practices for Next.js App Router, uses server actions for mutations, implements comprehensive security through RLS, and provides a complete workflow from problem discovery to project implementation.
