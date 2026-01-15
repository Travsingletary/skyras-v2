# Studio Control Room Smoke Test Guide

This document provides manual testing steps to verify the Studio Control Room dashboard is working correctly.

## Prerequisites

- Development server running: `npm run dev`
- Authenticated user session (login at `/login` if needed)
- Access to `/studio` page

## Test 1: Dashboard Updates

### Steps:
1. Navigate to `http://localhost:3000/studio`
2. Observe the dashboard loads with panels
3. Wait 2-3 seconds
4. Check that data refreshes automatically (watch for timestamp updates in System Health panel)

### Expected Results:
- Dashboard displays immediately
- Data updates every 2-3 seconds
- No console errors
- All panels show loading states initially, then data or empty states

## Test 2: Polling Pause on Tab Hidden

### Steps:
1. Open `/studio` in browser
2. Wait for initial data load
3. Switch to another tab (or minimize browser)
4. Wait 10 seconds
5. Switch back to `/studio` tab
6. Observe data immediately refreshes

### Expected Results:
- Polling pauses when tab is hidden (check Network tab - no requests while hidden)
- Polling resumes immediately when tab becomes visible
- Data refreshes within 2-3 seconds after returning to tab

## Test 3: Projects Gates Population

### Prerequisites:
- At least one project exists for the authenticated user

### Steps:
1. Navigate to `/studio`
2. Check the "Project Gates" panel
3. Verify projects are listed with gate status

### Expected Results:
- If projects exist: Projects shown with status badges (Blocked/In Progress/Ready)
- Each project shows:
  - Project name
  - Status badge
  - Blocked reason (if blocked)
  - Next action (if applicable)
  - Reference count and storyboard frame counts (if available)
- If no projects: Shows "No projects with gate data"
- If gates unsupported: Shows "Gates unavailable - Connect projects source"

### Troubleshooting:
- If gates show as "unavailable", check:
  - User is authenticated
  - Projects exist in database for this user
  - `computeProjectStatus` function is accessible

## Test 4: Task Queue Display

### Prerequisites:
- At least one active workflow exists
- Workflow has tasks (if workflow count ≤ 3, tasks will be fetched)

### Steps:
1. Navigate to `/studio`
2. Check the "Task Queue" panel
3. Verify tasks are grouped by status

### Expected Results:
- Tasks grouped into: Pending, In Progress, Recently Completed
- Each group shows count in header
- Tasks show name or ID
- Status chips are color-coded
- If no tasks or too many workflows: Shows appropriate message

### Notes:
- Tasks are only fetched if workflow count ≤ 3 (to avoid spam)
- If workflow count > 3, panel shows message explaining task details not included

## Test 5: Trigger Workflow and See It Appear

### Steps:
1. Navigate to `/studio`
2. Click "Run Test Workflow" button (if enabled)
3. Wait 2-3 seconds
4. Check "Active Workflows" panel
5. Verify new workflow appears

### Expected Results:
- "Run Test Workflow" button is enabled (if `/api/test/golden-path` exists)
- Clicking button triggers workflow creation
- Dashboard refreshes automatically
- New workflow appears in "Active Workflows" panel
- Workflow shows progress bar and status

### Alternative Test:
- Create workflow manually via Command panel or `/api/workflows` POST
- Verify it appears in dashboard within 2-3 seconds

## Test 6: Agent Activity Display

### Steps:
1. Navigate to `/studio`
2. Check "Agent Activity" panel
3. Verify agent statuses are shown

### Expected Results:
- Agents listed: Marcus, Giorgio, Jamal, Letitia, Cassidy (if present)
- Each agent shows:
  - Status badge (Working/Available/Idle)
  - Current task (if working)
  - Queue depth
  - Counts (pending, in progress, completed today)

## Test 7: Error Handling

### Steps:
1. Navigate to `/studio`
2. Open browser DevTools Network tab
3. Block one API endpoint (e.g., `/api/agents/status`) using browser DevTools
4. Observe dashboard behavior

### Expected Results:
- Other panels continue to load
- System Health panel shows error for failed source
- Errors array in response includes failed source
- No crashes or unhandled exceptions
- UI shows appropriate error states

## Test 8: Quick Actions

### Steps:
1. Navigate to `/studio`
2. Test each quick action button:
   - **Refresh Now**: Manually triggers data refresh
   - **Show/Hide Command**: Toggles command panel
   - **New Workflow**: Opens command panel (workflow creation needs user input)
   - **Run Test Workflow**: Runs test workflow if endpoint exists
   - **Create Project**: Links to projects page
   - **View All Workflows**: Links to workflows page
   - **Open Projects**: Links to projects page

### Expected Results:
- All buttons are clickable
- Disabled buttons show tooltip "Not implemented" if endpoint doesn't exist
- Links navigate correctly
- Command panel opens/closes smoothly

## Test 9: Build Stamp Visibility

### Steps:
1. Navigate to `/studio`
2. Scroll to bottom of page
3. Check bottom-left corner

### Expected Results:
- Build stamp visible: "STUDIO_CONTROL_ROOM_V1 — 2026-01-08"
- Stamp is fixed position (doesn't scroll)
- Stamp has semi-transparent background

## Test 10: Responsive Layout

### Steps:
1. Navigate to `/studio` on desktop
2. Resize browser window to mobile size (< 768px)
3. Verify layout adapts

### Expected Results:
- Desktop: 2-3 column grid
- Mobile: Single column (stacked panels)
- All panels remain readable
- Quick actions wrap appropriately

## Common Issues and Solutions

### Issue: Dashboard shows "Loading..." indefinitely
**Solution**: Check browser console for errors. Verify API endpoints are accessible.

### Issue: No data appears in panels
**Solution**: 
- Verify user is authenticated
- Check Network tab for failed requests
- Verify database has data for this user

### Issue: Polling doesn't pause when tab hidden
**Solution**: Check browser supports `document.visibilityState` API. Modern browsers should support this.

### Issue: Tasks not showing
**Solution**: 
- Verify workflow count ≤ 3 (tasks only fetched for small counts)
- Check workflows have tasks
- Verify `/api/workflows/[id]` endpoint works

### Issue: Projects gates show "unavailable"
**Solution**:
- Verify user is authenticated
- Check projects exist for user
- Verify `computeProjectStatus` function is accessible
- Check for errors in System Health panel

## Verification Checklist

- [ ] Dashboard loads without errors
- [ ] Data updates every 2-3 seconds
- [ ] Polling pauses when tab hidden
- [ ] Projects gates populate (if projects exist)
- [ ] Task queue shows tasks (if workflows ≤ 3)
- [ ] Agent activity displays correctly
- [ ] Workflows appear after creation
- [ ] Error handling works (partial failures don't break dashboard)
- [ ] Quick actions work
- [ ] Build stamp is visible
- [ ] Responsive layout works
- [ ] No console errors
- [ ] No TypeScript build errors

## Notes

- All tests should be performed with a real authenticated user session
- Some tests require existing data (projects, workflows) to be meaningful
- The dashboard is defensive - it should never crash, even if APIs fail
- Task fetching is intentionally limited to avoid performance issues
