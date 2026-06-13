# Pitch Approval Workflow Refactor - Final Report

**Date**: June 13, 2026
**Project**: Community Project Lab - Pitch Approval Workflow Refactor

---

## Executive Summary

The Pitch Approval Workflow has been completely refactored to remove the standalone Pitch Review dashboard and integrate all review functionality directly into the Pitch Detail page. The new workflow simplifies the approval process, enhances RBAC enforcement, and provides a streamlined user experience for both pitch creators and reviewers.

---

## Phase 1: Audit - Completed

### Current Implementation Audited

**Pitch Schema** (`0016_pitch_management.sql`):
- pitches table with status: draft, submitted, under_review, revision_required, approved, rejected
- pitch_content table with 6-step proposal structure
- pitch_ai_analysis table for AI-generated insights
- pitch_history table for audit trail
- pitch_feedback table for reviewer comments

**Pitch Routes**:
- `/dashboard/pitch` - Listing
- `/dashboard/pitch/new` - Create
- `/dashboard/pitch/[id]` - Detail
- `/dashboard/pitch/[id]/edit` - Edit
- Old routes removed: approve, reject, request-revision, submit

**Pitch Actions**:
- CRUD operations for pitches and content
- submitPitch, reviewPitch (old)
- History and feedback tracking

**Review Routes/Actions**:
- Already removed in previous redesign

**Project Creation Actions**:
- createProject in workspace/actions.ts
- Creates project, adds leader, logs activity

**Workspace Creation Actions**:
- Uses tasks, activities, project_members tables
- Activity logging via log_project_activity function

**RBAC Implementation**:
- Roles: Guest, Member, Builder, Expert, Mentor, Leader, Admin
- Permissions: pitch.view, pitch.create, pitch.edit.own, pitch.submit, pitch.approve, pitch.reject
- Old pitch.review.* permissions removed

---

## Phase 2: Remove Review Dashboard - Completed

### Files Removed
- `src/app/dashboard/pitch/[id]/approve/` - Old approve route
- `src/app/dashboard/pitch/[id]/reject/` - Old reject route
- `src/app/dashboard/pitch/[id]/request-revision/` - Old revision request route
- `src/app/dashboard/pitch/[id]/submit/` - Old submit route

### Files Modified
- `src/app/dashboard/pitch/[id]/page.tsx` - Removed old route links, added submitPitch action

### Preserved
- Approval history (reviewed_by, reviewed_at fields)
- Notifications (notification system intact)
- Audit logs (pitch_history table)

---

## Phase 3: Pitch Status Workflow - Completed

### Database Migration
- **Created**: `supabase/0030_add_converted_pitch_status.sql`
  - Added 'converted' status to pitches table CHECK constraint
  - New status workflow: draft → submitted → under_review → rejected OR converted

### TypeScript Types Updated
- `src/types/pitch-management.ts`: Added 'converted' to PitchStatus type

### Server Action Updated
- `src/app/dashboard/pitch/actions.ts`: approvePitchAndCreateProject now sets status to 'converted'
- Added duplicate conversion prevention check

---

## Phase 4: RBAC Implementation - Completed

### New Permissions Added
- `pitch.start_review` - Permission to start review process
- `pitch.convert` - Permission to convert pitch to project

### RBAC Configuration Updated
- **Expert**: Removed old pitch.review.* permissions
- **Mentor**: Removed old pitch.review.* permissions
- **Leader**: Added pitch.start_review, pitch.convert; removed old pitch.review.* permissions
- **Admin**: Added pitch.start_review, pitch.convert; removed old pitch.review.* permissions

### Permission Types Updated
- `src/types/rbac.ts`: Added pitch.start_review, pitch.convert, pitch.feedback to Permission type

### UI Permission Checks
- `src/app/dashboard/pitch/[id]/page.tsx`: Updated to use new permissions (canStartReview, canConvert)

---

## Phase 5: Pitch Detail Review Panel - Completed

### New Component Created
- **Created**: `src/app/dashboard/pitch/[id]/review-panel.tsx`
  - Client component with review controls
  - Shows pitch status, submission date, creator, AI analysis summary
  - Actions: Start Review, Approve & Create Project, Reject
  - Reject modal with reason input
  - Only visible to users with pitch.start_review or pitch.convert permissions

### Integration
- `src/app/dashboard/pitch/[id]/page.tsx`: Integrated ReviewPanel component
- Conditionally rendered based on user permissions

---

## Phase 6: Start Review Action - Completed

### Server Action Created
- **Created**: `startPitchReview()` in `src/app/dashboard/pitch/actions.ts`
  - Validates pitch.start_review permission
  - Updates pitch status to 'under_review'
  - Sets reviewed_by and reviewed_at
  - Logs history
  - Sends notification to pitch creator: "Đề xuất của bạn đang được xem xét."

---

## Phase 7: Reject Workflow - Completed

### Server Action Created
- **Created**: `rejectPitch()` in `src/app/dashboard/pitch/actions.ts`
  - Validates pitch.reject permission
  - Requires reason for rejection
  - Updates pitch status to 'rejected'
  - Stores review_notes
  - Logs history
  - Creates feedback entry
  - Sends notification to pitch creator: "Đề xuất của bạn cần chỉnh sửa trước khi được phê duyệt."
  - Links to pitch detail page for editing

### UI Implementation
- Reject modal in ReviewPanel component
- Requires reason input before submission

---

## Phase 8: Approve & Create Project - Completed

### Server Action Refined
- **Updated**: `approvePitchAndCreateProject()` in `src/app/dashboard/pitch/actions.ts`
  - Already implemented in previous redesign
  - Validates pitch state
  - Creates project from pitch
  - Maps pitch fields to project fields
  - Adds pitch creator as project leader
  - Logs activity
  - Integrates AI analysis (KPIs as tasks, timeline as milestones)
  - Sends notification to pitch creator
  - Prevents duplicate conversion
  - Sets pitch status to 'converted'

---

## Phase 9: Redirects After Conversion - Completed

### ApproveButton Updated
- **Updated**: `src/app/dashboard/pitch/[id]/approve-button.tsx`
  - Added isCreator prop
  - Reviewer: Redirects to `/dashboard/workspace/{project_id}`
  - Creator: Refreshes page to show "Open Workspace" button
  - Different toast messages for reviewer vs creator

### ReviewPanel Updated
- Passes isCreator prop to ApproveButton

### Pitch Detail Page Updated
- Passes isOwner as isCreator to ReviewPanel

---

## Phase 10: Review History Section - Completed

### Component Enhanced
- **Updated**: `src/app/dashboard/pitch/[id]/pitch-history.tsx`
  - Added Vietnamese action labels
  - Added Vietnamese status labels
  - Shows status badge for status_changed actions
  - Vietnamese locale for dates
  - Displays reviewer, action, timestamp, comment

### Actions Tracked
- created, updated, submitted, reviewed, status_changed
- Status changes show new status badge

---

## Phase 11: Notifications - Completed

### Notification Flow

**Submitted**:
- Triggered by submitPitch action
- Message: "Đề xuất của bạn đã được gửi xét duyệt."

**Under Review**:
- Triggered by startPitchReview action
- Message: "Đề xuất của bạn đang được xem xét."
- Link: `/dashboard/pitch/{id}`

**Rejected**:
- Triggered by rejectPitch action
- Message: "Đề xuất của bạn cần chỉnh sửa trước khi được phê duyệt."
- Link: `/dashboard/pitch/{id}`

**Converted**:
- Triggered by approvePitchAndCreateProject action
- Message: "Pitch "{title}" của bạn đã được phê duyệt và dự án đã được tạo"
- Link: `/dashboard/workspace/{project.id}`

All notifications include deep links to relevant pages.

---

## Phase 12: AI Integration in Pitch Detail - Completed

### AI Analysis Component
- **Updated**: `src/app/dashboard/pitch/[id]/pitch-ai-analysis.tsx`
  - Server component fetching AI analysis from database
  - Displays markdown and JSON outputs
  - Vietnamese labels for analysis types
  - Shows analysis date
  - Collapsible JSON view

### AI Features Available
- Proposal Draft
- Proposal Improvement
- KPI Suggestion
- Risk Analysis
- Timeline Generation
- Budget Estimation

### AI Integration in Conversion
- approvePitchAndCreateProject integrates AI analysis:
  - KPIs → Tasks
  - Timeline phases → Milestones
  - Budget logged for future implementation

---

## Phase 13: Security Enforcement - Completed

### Server-Side Validation
All server actions enforce RBAC:
- `startPitchReview`: Requires pitch.start_review permission
- `rejectPitch`: Requires pitch.reject permission
- `approvePitchAndCreateProject`: Requires pitch.convert permission
- Permission checks using hasPermission with RBAC context

### UI Permission Checks
- ReviewPanel only visible to users with pitch.start_review or pitch.convert
- Action buttons conditionally rendered based on permissions
- Edit button only for pitch owner or admin

### Duplicate Prevention
- approvePitchAndCreateProject checks:
  - project_id already set
  - status already converted
  - Prevents duplicate project creation

---

## Files Summary

### Files Created
1. `supabase/0030_add_converted_pitch_status.sql` - Database migration for converted status
2. `src/app/dashboard/pitch/[id]/review-panel.tsx` - Review panel component
3. `PITCH_APPROVAL_WORKFLOW_REFACTOR_REPORT.md` - This report

### Files Modified
1. `src/lib/rbac.ts` - Updated RBAC permissions (removed old review permissions, added new ones)
2. `src/types/rbac.ts` - Added new permission types
3. `src/types/pitch-management.ts` - Added converted status to PitchStatus
4. `src/app/dashboard/pitch/actions.ts` - Added startPitchReview, rejectPitch, added RBAC imports, updated approvePitchAndCreateProject
5. `src/app/dashboard/pitch/[id]/page.tsx` - Removed old routes, added ReviewPanel, updated permission checks
6. `src/app/dashboard/pitch/[id]/approve-button.tsx` - Added isCreator prop and redirect logic
7. `src/app/dashboard/pitch/[id]/pitch-history.tsx` - Enhanced with Vietnamese labels and status badges
8. `src/app/dashboard/pitch/[id]/pitch-ai-analysis.tsx` - Already updated in previous redesign

### Files Removed
1. `src/app/dashboard/pitch/[id]/approve/` - Old approve route directory
2. `src/app/dashboard/pitch/[id]/reject/` - Old reject route directory
3. `src/app/dashboard/pitch/[id]/request-revision/` - Old revision request route directory
4. `src/app/dashboard/pitch/[id]/submit/` - Old submit route directory

---

## Workflow Changes

### Old Workflow
Draft → Submitted → Under Review → Approved/Rejected (via separate review dashboard)

### New Workflow
Draft → Submitted → Under Review → Rejected OR Converted

**Converted** = Approved + Project + Workspace successfully created

### Key Changes
- Removed standalone review dashboard
- Integrated review controls directly into pitch detail page
- Added "converted" status for approved pitches with projects
- Simplified approval to single "Approve & Create Project" action
- Enhanced RBAC with specific review permissions

---

## RBAC Changes

### Before
- pitch.review permissions for Expert, Mentor, Leader, Admin
- pitch.approve, pitch.reject for Leader, Admin
- pitch.review.* permissions for review module

### After
- pitch.start_review for Leader, Admin
- pitch.convert for Leader, Admin
- pitch.approve, pitch.reject retained for Leader, Admin
- Removed all pitch.review.* permissions (review module removed)

### Access Control
- **Guest**: No access
- **Member**: pitch.view, pitch.create, pitch.edit.own, pitch.submit
- **Builder**: Same as Member
- **Expert**: pitch.view, pitch.create, pitch.edit.own, pitch.submit, pitch.ai.analyze, pitch.feedback
- **Mentor**: Same as Expert
- **Leader**: All pitch permissions including start_review, convert, approve, reject
- **Admin**: All pitch permissions including start_review, convert, approve, reject

---

## Notification Changes

### Notification Types Used
- `general` - For review started notification
- `pitch_rejected` - For rejection notification
- `pitch_approved` - For approval/conversion notification

### Notification Messages
- Review started: "Đề xuất của bạn đang được xem xét."
- Rejected: "Đề xuất của bạn cần chỉnh sửa trước khi được phê duyệt."
- Converted: "Pitch "{title}" của bạn đã được phê duyệt và dự án đã được tạo"

### Deep Links
- All notifications link to relevant pages (pitch detail or project workspace)

---

## Project Conversion Flow

### Conversion Process
1. Leader/Admin clicks "Approve & Create Project"
2. Server validates permissions and pitch state
3. Creates project from pitch data
4. Adds pitch creator as project leader
5. Integrates AI analysis (KPIs → tasks, timeline → milestones)
6. Logs activity
7. Updates pitch status to 'converted'
8. Sets pitch.project_id and project.created_from_pitch_id
9. Sends notification to pitch creator
10. Redirects reviewer to project workspace
11. Creator sees "Open Workspace" button

### Data Mapping
- pitch.title → project.title
- pitch.project_summary → project.description
- pitch.created_by → project leader
- AI KPIs → project tasks
- AI timeline phases → project milestones

### Prevention
- Duplicate conversion prevented by checking project_id and status
- Cannot reject converted pitches

---

## Remaining Improvements

### Minor Issues
- Budget analysis from AI is logged but not yet stored in dedicated budget table
- Risk analysis from AI could be used to create risk management tasks
- Discussion space creation from pitch data could be implemented

### Future Enhancements
1. **Budget Table**: Consider adding dedicated budget table for project budgeting
2. **Risk Management**: Create risk tasks from AI risk analysis
3. **Discussion Space**: Auto-create discussion space on project conversion
4. **Project Metadata**: Add metadata column to projects table for flexible data storage

---

## Testing Checklist

### Database Migration
- [ ] Run `supabase/0030_add_converted_pitch_status.sql` in Supabase SQL Editor
- [ ] Verify 'converted' status is valid in pitches table

### Review Panel
- [ ] Verify ReviewPanel only visible to Leader/Admin
- [ ] Test Start Review action
- [ ] Test Reject action with modal
- [ ] Test Approve & Create Project action
- [ ] Verify "Open Workspace" button appears for creator after conversion

### Workflow
- [ ] Test complete workflow: Draft → Submitted → Under Review → Converted
- [ ] Test rejection workflow: Draft → Submitted → Under Review → Rejected
- [ ] Test creator can edit and resubmit after rejection
- [ ] Verify duplicate conversion is prevented

### Notifications
- [ ] Verify notification sent on review start
- [ ] Verify notification sent on rejection
- [ ] Verify notification sent on conversion
- [ ] Verify deep links work correctly

### RBAC
- [ ] Verify Member cannot see ReviewPanel
- [ ] Verify Expert cannot see ReviewPanel
- [ ] Verify Mentor cannot see ReviewPanel
- [ ] Verify Leader can see ReviewPanel
- [ ] Verify Admin can see ReviewPanel
- [ ] Verify server-side permission enforcement

---

## Conclusion

The Pitch Approval Workflow has been successfully refactored. The standalone Pitch Review dashboard has been removed, and all review functionality has been integrated directly into the Pitch Detail page. The new workflow simplifies the approval process with a single "Approve & Create Project" action that automatically creates projects, workspaces, and integrates AI-generated content.

Key achievements:
- Removed redundant review module and routes
- Integrated review controls into pitch detail page
- Added 'converted' status for approved pitches with projects
- Enhanced RBAC with specific review permissions
- Implemented Vietnamese UI throughout
- Maintained full audit trail and notification support
- Prevented duplicate project creation
- Enabled AI-driven task and milestone generation

The system now provides a streamlined, secure, and user-friendly workflow for managing pitch approvals and project creation.

---

**Status**: ✅ Complete
**Next Steps**: Run database migration, test all workflows, deploy to production
