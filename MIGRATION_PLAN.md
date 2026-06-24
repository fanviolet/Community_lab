# Community Project Lab 2.0 Dashboard Migration Plan

## Phase 1: Architecture Audit - COMPLETED

### Current Routes Structure
```
/dashboard
  /problems (Problem Board)
  /problems/[id] (Problem Detail)
  /problems/new (New Problem)
  /pitch (Proposals)
  /pitch/[id] (Proposal Detail)
  /pitch/new (New Proposal)
  /workspace (Project Workspace)
  /workspace/[id] (Project Detail)
  /workspace/new (New Project)
  /insights (AI Insights)
  /discussion (Discussion Hub)
  /notifications (Notifications)
  /profile (User Profile)
  /settings (Settings)
  /team (Team Management)
  /users (User Management)
  /admin (Admin Panel)
  /mentoring (Mentoring)
  /expert-analysis (Expert Analysis)
  /projects (KPI Tracking)
```

### Current Sidebar Structure
- **Overview**: Dashboard, Profile
- **Community**: Problem Board, Discussion, AI Insights
- **Projects**: Proposals, Project Workspace, KPI Tracking
- **Administration**: Mentors, Expert Analysis, Team Management, Admin Panel, User Management, System Settings

### Current Dashboard Components
- DashboardKPICard (4 KPI cards with trends)
- CommunityPipeline (8-stage workflow visualization)
- ProposalCard (Proposal display with AI score)
- AlertCenter (Early warning panel)
- ProjectHealthCard (Project health indicators)

### RBAC System
- Roles: Guest, Member, Builder, Expert, Mentor, Leader, Admin
- Comprehensive permission system (100+ permissions)
- Role-based navigation filtering

### Current Issues
1. **Sidebar**: Not fully aligned with workflow-based navigation
2. **Dashboard**: Missing priority items section, early warning needs enhancement
3. **Problem Board**: No board view, limited sorting options
4. **Discussion Hub**: Basic implementation, needs Reddit/Discord-style structure
5. **AI Insights**: Currently shows summaries, needs decision support visualization
6. **Proposal Center**: No review queue for admins/mentors
7. **Project Workspace**: Missing timeline, milestones, detailed health indicators
8. **Notifications**: No global unread count in sidebar
9. **Design System**: Inconsistent border radius usage
10. **Responsive**: Not verified at all breakpoints

---

## Phase 2: Migration Strategy

### Design System Updates
- **Colors**: Already aligned (#534AB7 primary, #1D9E75 success, #BA7517 warning, #E24B4A danger)
- **Border Radius**: Enforce rounded-xl and rounded-2xl only
- **Spacing**: 8px grid system
- **Typography**: Clean, minimal (Linear/Notion/Stripe style)

### Component Reuse & Consolidation
**Existing Components to Keep:**
- DashboardKPICard → Reuse for KPI grid
- CommunityPipeline → Enhance with bottleneck detection
- ProposalCard → Enhance with review queue integration
- AlertCenter → Enhance with more alert types
- ProjectHealthCard → Enhance with timeline integration

**New Components to Create:**
- KPICard (Unified KPI component)
- WorkflowPipeline (Enhanced pipeline with visual flow)
- ProblemCard (Enhanced problem display)
- HealthCard (Unified health indicator)
- InsightCard (Decision support visualization)
- AlertCard (Unified alert display)
- MetricCard (Trend display)
- SectionHeader (Consistent section headers)
- WorkspaceSwitcher (Workspace selection)
- RoleBadge (Role display)
- UnreadBadge (Notification count)

**Components to Refactor:**
- DashboardShell → AppShell with responsive behavior
- DashboardSidebar → Workflow-based navigation
- ProblemBoard → Add board/list views
- DiscussionHub → Reddit/Discord-style threads
- AI Insights page → Decision support engine
- Proposal page → Add review queue
- Workspace page → Add timeline/milestones

---

## Phase 3: Implementation Order

### Priority 1: Foundation (High)
1. Update design system (enforce border radius, spacing)
2. Refactor AppShell with responsive behavior
3. Restructure sidebar with workflow-based navigation
4. Add workspace switcher and role badges
5. Add global unread notification count

### Priority 2: Dashboard Redesign (High)
6. Enhance KPI grid (add trends, descriptions)
7. Enhance community pipeline (add bottleneck detection)
8. Add priority items section
9. Enhance early warning center
10. Add welcome card with greeting

### Priority 3: Core Features (Medium)
11. Redesign problem board (add board view, sorting)
12. Enhance discussion hub (Reddit/Discord style)
13. Redesign AI insights (decision support visualization)
14. Add proposal review queue
15. Enhance project workspace (timeline, milestones)

### Priority 4: Advanced Features (Medium)
16. Create KPI tracking dashboard
17. Enhance notifications with grouping
18. Add project health indicators
19. Add impact metrics

### Priority 5: Polish (Low)
20. Verify responsive design at all breakpoints
21. Optimize performance (remove duplicates, reduce rerenders)
22. Add lazy loading for heavy sections
23. Create documentation

---

## Phase 4: Files to Modify

### Layout & Shell
- `src/app/layout.tsx` - Root layout
- `src/app/dashboard/layout.tsx` - Dashboard layout
- `src/components/dashboard/dashboard-shell.tsx` → `src/components/layout/AppShell.tsx`
- `src/components/dashboard-sidebar.tsx` → `src/components/layout/AppSidebar.tsx`
- `src/components/dashboard-header.tsx` → `src/components/layout/AppHeader.tsx`

### Design System
- `src/app/globals.css` - Enforce border radius, spacing
- `tailwind.config.ts` - Add custom utilities

### Navigation
- `src/lib/dashboard-nav.ts` - Restructure navigation sections

### Dashboard
- `src/app/dashboard/page.tsx` - Enhance with new sections
- `src/components/dashboard/DashboardKPICard.tsx` - Keep and enhance
- `src/components/dashboard/CommunityPipeline.tsx` - Enhance
- `src/components/dashboard/ProposalCard.tsx` - Enhance
- `src/components/dashboard/AlertCenter.tsx` - Enhance

### Problem Board
- `src/app/dashboard/problems/page.tsx` - Add view toggle
- `src/components/problems/problem-board.tsx` - Add board view
- `src/components/problems/problem-list.tsx` - Enhance

### Discussion
- `src/app/dashboard/discussion/page.tsx` - Enhance
- `src/components/discussion/DiscussionHub.tsx` - Redesign

### AI Insights
- `src/app/dashboard/insights/page.tsx` - Redesign as decision support
- `src/components/insights/InsightSummaryCard.tsx` - Enhance

### Proposals
- `src/app/dashboard/pitch/page.tsx` - Add review queue
- `src/components/dashboard/ProposalCard.tsx` - Enhance

### Workspace
- `src/app/dashboard/workspace/page.tsx` - Add timeline, milestones
- `src/components/dashboard/ProjectHealthCard.tsx` - Enhance

### Notifications
- `src/app/dashboard/notifications/page.tsx` - Enhance grouping
- Add global unread count to sidebar

### New Components
- `src/components/shared/KPICard.tsx`
- `src/components/shared/WorkflowPipeline.tsx`
- `src/components/shared/ProblemCard.tsx`
- `src/components/shared/HealthCard.tsx`
- `src/components/shared/InsightCard.tsx`
- `src/components/shared/AlertCard.tsx`
- `src/components/shared/MetricCard.tsx`
- `src/components/shared/SectionHeader.tsx`
- `src/components/layout/WorkspaceSwitcher.tsx`
- `src/components/layout/RoleBadge.tsx`
- `src/components/layout/UnreadBadge.tsx`

---

## Phase 5: Routes Affected

### Modified Routes
- `/dashboard` - Enhanced with new sections
- `/dashboard/problems` - Add board/list views
- `/dashboard/discussion` - Redesign
- `/dashboard/insights` - Redesign
- `/dashboard/pitch` - Add review queue
- `/dashboard/workspace` - Add timeline/milestones
- `/dashboard/notifications` - Enhanced grouping

### New Routes (Optional)
- `/dashboard/kpi` - Dedicated KPI tracking dashboard
- `/dashboard/analytics` - Advanced analytics

---

## Phase 6: Success Criteria

1. ✅ Sidebar follows workflow-based navigation
2. ✅ Dashboard shows community command center with all sections
3. ✅ Problem board has board/list views with filtering/sorting
4. ✅ Discussion hub has Reddit/Discord-style threads
5. ✅ AI insights show decision support visualization
6. ✅ Proposal center has review queue for authorized roles
7. ✅ Project workspace shows timeline, milestones, health indicators
8. ✅ KPI tracking dashboard with charts
9. ✅ Notifications have grouping and global unread count
10. ✅ Responsive design works at 320px, 768px, 1024px, 1440px
11. ✅ Performance optimized (no duplicate components, reduced rerenders)
12. ✅ Design system enforced (rounded-xl/2xl only, 8px grid)

---

## Phase 7: Risk Mitigation

1. **Breaking Changes**: Minimize by extending existing components
2. **RBAC Integration**: Ensure all new features respect existing permissions
3. **Data Migration**: No schema changes required, only UI updates
4. **Performance**: Use lazy loading for heavy sections
5. **Responsive**: Test at all breakpoints before deployment

---

## Phase 8: Timeline Estimate

- **Phase 1-2 (Foundation)**: 2-3 hours
- **Phase 3 (Dashboard)**: 2-3 hours
- **Phase 4 (Core Features)**: 4-5 hours
- **Phase 5 (Advanced Features)**: 3-4 hours
- **Phase 6 (Polish)**: 2-3 hours

**Total**: 13-18 hours
