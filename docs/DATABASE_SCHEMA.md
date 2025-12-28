# Database Schema - SkyRas v2

**Last Updated:** 2025-01-27  
**Purpose:** Document the actual Supabase database schema (ground truth)

---

## Verification Status

✅ **VERIFIED** - Schema queried directly from Supabase database

---

## Tables Summary

Total tables in `public` schema: **32**

### Core Tables
- `conversations` (16 rows)
- `messages` (107 rows)
- `projects` (0 rows)
- `files` (40 rows)
- `workflows` (5 rows) ⭐ **EXISTS**
- `workflow_tasks` (5 rows)
- `tasks` (6 rows)
- `workflow_steps` (5 rows)

### Agent & Activity Tables
- `agent_runs` (8 rows)
- `assets` (8 rows)
- `compliance_scans` (0 rows)
- `file_processing` (43 rows)
- `marcus_manager_state` (0 rows)

### Planning & Scheduling Tables
- `daily_plans` (0 rows)
- `daily_plan_blocks` (0 rows)
- `calendar_events` (0 rows)
- `google_oauth_tokens` (0 rows)

### Publishing & Distribution Tables
- `campaigns` (0 rows)
- `content_items` (0 rows)
- `posts` (0 rows)
- `post_templates` (0 rows)
- `publishing_jobs` (0 rows)
- `publishing_logs` (0 rows)
- `publishing_settings` (1 row)
- `social_accounts` (0 rows)
- `scheduled_posts` (0 rows)

### RBAC & Auth Tables
- `rbac_roles` (2 rows)
- `rbac_permissions` (8 rows)
- `rbac_role_permissions` (12 rows)
- `rbac_user_roles` (1 row)
- `user_roles` (0 rows)

### Logging Tables
- `image_generation_logs` (0 rows)
- `push_notification_tokens` (0 rows)

---

## Missing Tables

❌ **`studio_plans`** - Does NOT exist  
- Referenced in code: `src/app/api/data/plans/route.ts`
- Status: Code returns empty array
- Recommendation: Use `workflows` table instead (has `plan_markdown` field)

---

## Key Table: `workflows`

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `created_at` | timestamptz | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | NO | now() | Update timestamp |
| `user_id` | text | NO | - | User identifier |
| `project_id` | uuid | YES | null | Project reference (FK to projects) |
| `name` | text | NO | - | Workflow name |
| `type` | text | NO | - | Workflow type (e.g., "creative", "distribution") |
| `status` | text | NO | 'active' | Status (e.g., "active", "completed", "paused", "cancelled") |
| `plan_markdown` | text | YES | null | Plan content in markdown format |
| `summary` | text | YES | null | Workflow summary |
| `agent_name` | text | NO | 'marcus' | Assigned agent |
| `total_tasks` | integer | NO | 0 | Total number of tasks |
| `completed_tasks` | integer | NO | 0 | Number of completed tasks |
| `metadata` | jsonb | YES | '{}' | Additional metadata |

### Constraints
- Primary Key: `id`
- Foreign Key: `project_id` → `projects.id`

### Sample Data (3 rows)

```json
[
  {
    "id": "62c6348c-4223-4c7b-a40a-0f9d906593d0",
    "created_at": "2025-12-19T03:56:42.50469Z",
    "updated_at": "2025-12-19T03:56:42.50469Z",
    "user_id": "user_1766082380139_h52zx8hp6",
    "project_id": null,
    "name": "Content Distribution Plan",
    "type": "distribution",
    "status": "active",
    "plan_markdown": "Create distribution strategy for your content across platforms",
    "summary": null,
    "agent_name": "marcus",
    "total_tasks": 1,
    "completed_tasks": 0,
    "metadata": {}
  },
  {
    "id": "4e8512f7-c4a4-4f40-9d7f-21155eafcd81",
    "created_at": "2025-12-19T03:54:28.631843Z",
    "updated_at": "2025-12-19T03:54:28.631843Z",
    "user_id": "public",
    "project_id": null,
    "name": "Workflow: generateRunwayVideo:SkySky",
    "type": "creative",
    "status": "active",
    "plan_markdown": null,
    "summary": "Auto-executed workflow with 1 task(s)",
    "agent_name": "marcus",
    "total_tasks": 1,
    "completed_tasks": 0,
    "metadata": {
      "delegations": [{"task": "generateRunwayVideo:SkySky", "agent": "giorgio", "status": "pending"}],
      "autoExecuted": true,
      "originalUserId": "user_1766082380139_h52zx8hp6"
    }
  }
]
```

---

## Complete Table List

1. `agent_runs`
2. `assets`
3. `calendar_events`
4. `campaigns`
5. `compliance_scans`
6. `content_items`
7. `conversations`
8. `daily_plan_blocks`
9. `daily_plans`
10. `file_processing`
11. `files`
12. `google_oauth_tokens`
13. `image_generation_logs`
14. `marcus_manager_state`
15. `messages`
16. `post_templates`
17. `posts`
18. `projects`
19. `publishing_jobs`
20. `publishing_logs`
21. `publishing_settings`
22. `push_notification_tokens`
23. `rbac_permissions`
24. `rbac_role_permissions`
25. `rbac_roles`
26. `rbac_user_roles`
27. `scheduled_posts`
28. `social_accounts`
29. `tasks`
30. `user_roles`
31. `workflow_steps`
32. `workflow_tasks`
33. `workflows` ⭐

---

## Enums

No custom enums found in the public schema.

---

## Views

No views found in the public schema.

---

## Key Findings

### ✅ What Exists
- `workflows` table exists and contains plan data
- `plan_markdown` column can store plan content
- 5 workflows currently in database

### ❌ What's Missing
- `studio_plans` table does NOT exist
- Code expects `studio_plans` but should use `workflows` instead

### 🔧 Recommended Action
- Update `/api/data/plans` to query `workflows` table
- Filter by `project_id` when `project` parameter is provided
- Map workflow fields to plan format (use `plan_markdown` for plan content)

---

## Schema Verification Query

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Get workflows table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'workflows'
ORDER BY ordinal_position;

-- Check for studio_plans (doesn't exist)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'studio_plans';
-- Returns: empty result
```

---

**Last Verified:** 2025-01-27 via Supabase MCP tools
