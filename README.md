# Community Project Lab

A collaborative platform for community-driven problem solving, project management, and team collaboration. Built with Next.js 13, Supabase, and shadcn/ui.

## Features

### Core Functionality
- **Problem Board**: Submit, discuss, and vote on community problems
- **Project Pitch**: Create and submit project proposals for review
- **Project Workspace**: Manage projects with tasks, milestones, and team collaboration
- **Team Management**: Invite members, assign roles, and track contributions
- **AI Insights**: Generate AI-powered analysis for projects and workflows
- **Expert Analysis**: Professional review and scoring of project proposals
- **Mentoring**: Connect mentors with team members for guidance
- **Real-time Notifications**: Stay updated with mentions, task assignments, and project updates

### Role-Based Access Control (RBAC)
- **Guest**: Limited access, view-only
- **Member**: Full community access, can create problems and participate
- **Builder**: Can create and manage projects
- **Expert**: Can review and mentor projects
- **Mentor**: Can guide and teach team members
- **Leader**: Can manage teams and project workflows
- **Admin**: Full system access and configuration

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **State Management**: React Context, Server Actions
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd community-project-lab
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Supabase:
- Create a new project in Supabase Dashboard
- Run the SQL migrations in the `supabase/` directory
- Copy your Supabase URL and anon key to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Accounts

For testing purposes, the following demo accounts are available on the login page:

- **Guest**: guest@communitylab.demo / demo123
- **Leader**: leader@communitylab.demo / demo123

These accounts can be autofilled using the buttons on the login page.

## Seeding Demo Data

To populate the database with demo data (10 problems, 5 pitches, 5 projects):

```bash
npx tsx scripts/seed-demo.ts
```

## Database Migrations

The project uses Supabase migrations located in the `supabase/` directory. Key migrations include:

- `0001_profiles.sql` - User profiles table
- `0002_problems.sql` - Problem board table
- `0003_projects.sql` - Projects table
- `0004_project_members.sql` - Project members table
- `0005_pitches.sql` - Project pitches table
- `0006_pitch_content.sql` - Pitch content table
- `0007_pitch_history.sql` - Pitch history table
- `0008_pitch_feedback.sql` - Pitch feedback table
- `0009_notifications_table.sql` - Notifications table
- `0010_team_management.sql` - Team management tables
- `0011_mentoring.sql` - Mentoring tables
- `0012_rbac_roles.sql` - RBAC roles and permissions
- `0034_fix_notifications_rls.sql` - Fix notifications RLS policies

## Recent Improvements

### Final Polish Phase (June 2026)

**Completed Phases:**
1. ✅ Profile Settings page with avatar upload, bio, and display name
2. ✅ Role Display System - Created reusable RoleBadge component
3. ✅ Global Typography System - Created PageTitle, SectionTitle, PageDescription components
4. ✅ UI Consistency Polish - Standardized using shadcn/ui components
5. ✅ Global Feedback System - Notification system provides feedback
6. ✅ Notification System Verification - Fixed SQL schema to match TypeScript types
7. ✅ Demo Accounts - Added autofill buttons on login page
8. ✅ Demo Data Seeding - Created seed script for demo data

**Key Components Added:**
- `/components/common/role-badge.tsx` - Reusable role badge with consistent styling
- `/components/common/page-title.tsx` - Standardized page title component
- `/components/common/section-title.tsx` - Standardized section title component
- `/components/common/page-description.tsx` - Standardized page description component
- `/app/settings/profile/page.tsx` - Profile settings with avatar upload
- `/scripts/seed-demo.ts` - Demo data seeding script

**Database Updates:**
- Fixed notifications table schema to match TypeScript types
- Updated column names (read → is_read, title removed)
- Added notification types: task_assigned, task_completed, member_added, project_updated, pitch_approved, pitch_rejected, pitch_revision_requested, mention, ai_insight, general

## Deployment

### Vercel Deployment

The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Environment Variables

Required for production:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/          # Dashboard pages
│   ├── settings/           # Settings pages
│   ├── login/              # Login page
│   └── signup/             # Signup page
├── components/            # React components
│   ├── common/             # Shared components (role-badge, typography)
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # Authentication components
│   └── dashboard/          # Dashboard-specific components
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase client configuration
│   ├── notifications/      # Notification system
│   └── rbac.ts             # Role-based access control
└── types/                  # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
