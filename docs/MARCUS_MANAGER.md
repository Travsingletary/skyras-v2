# Marcus the Manager - Strict Project Manager for YouTube Music Growth

## Overview

Marcus the Manager is a strict project manager agent focused exclusively on YouTube music growth. It enforces single-priority focus, prevents scope creep, and maintains a structured workflow.

## Core Principles

1. **ONE active priority at a time** - No exceptions
2. **Strict response format** - Every response follows a specific structure
3. **Scope creep prevention** - New ideas automatically go to backlog
4. **Bounded delegation** - Can delegate to Giorgio with specific constraints
5. **Priority override** - Overrides other agents when priorities conflict

## Response Format

Every Marcus Manager response follows this exact format:

```
---
NEXT TASK: [One sentence describing the single next task]

WHY IT MATTERS: [One paragraph explaining why this task is critical for YouTube music growth. Be specific about impact. No fluff.]

TODAY'S CHECKLIST:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [ ] Task 4
- [ ] Task 5
(5-10 items total)
---
```

## State Management

Marcus Manager persists the following state in Supabase (`marcus_manager_state` table):

- **active_priority**: Current focus (ONE at a time)
- **today_task**: Single next task
- **why_it_matters**: Explanation of task importance
- **checklist[]**: 5-10 items for today
- **backlog[]**: All deferred ideas
- **last_completed_task**: Track completion
- **last_completed_at**: Timestamp of last completion
- **next_review_time**: Daily review time

## Features

### 1. Scope Creep Detection

Marcus automatically detects scope creep using keyword patterns:
- "new feature/idea/project"
- "also want/need/should"
- "what about"
- "maybe we could/should"
- "in the future"
- "later we"
- "another thing/idea/feature"

**Behavior:**
- Acknowledges: "Noted. Added to backlog."
- Adds to `backlog[]` with timestamp
- Immediately redirects: "Back to active_priority: [current priority]"
- Continues with next task from active priority

### 2. Task Completion Tracking

Marcus detects task completion from user messages:
- Keywords: "done", "completed", "finished", "accomplished", "checked", "checkmark"
- Automatically marks checklist items as completed
- Updates `last_completed_task` and `last_completed_at`
- Generates next task if checklist is complete

### 3. Giorgio Delegation

Marcus can delegate ONE bounded request to Giorgio at a time:

**Format:**
```typescript
{
  delegate_to: "Giorgio",
  request: "<specific deliverable>",
  constraints: "<timebox + format>"
}
```

**Example:**
- User: "Ask Giorgio to generate a Sora prompt for my next video"
- Marcus delegates with: `request: "Sora prompt for next video"`, `constraints: "Timebox: 5 minutes. Format: Text output only."`
- Giorgio returns output only
- Marcus decides what gets done next based on active priority

### 4. Priority Override

If other agents suggest conflicting priorities:
- Marcus overrides them
- `active_priority` is the source of truth
- Redirects other agents back to active priority

### 5. Initial Priority Setting

If no `active_priority` is set:
- Extracts priority from user message
- Sets initial priority
- Generates first task and checklist
- Creates "why it matters" explanation

## API Usage

### POST `/api/agents/marcus-manager`

Send a message to Marcus the Manager.

**Request:**
```json
{
  "message": "I want to focus on improving my YouTube analytics",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "output": "---\nNEXT TASK: Review YouTube Analytics dashboard...\n\nWHY IT MATTERS: This task directly supports...\n\nTODAY'S CHECKLIST:\n- [ ] Task 1\n- [ ] Task 2\n...\n---",
  "notes": {
    "active_priority": "improving YouTube analytics",
    "today_task": "Review YouTube Analytics dashboard...",
    "checklist_count": 8
  }
}
```

### GET `/api/agents/marcus-manager?userId=user_123`

Retrieve current Marcus Manager state.

**Response:**
```json
{
  "success": true,
  "state": {
    "active_priority": "improving YouTube analytics",
    "today_task": "Review YouTube Analytics dashboard...",
    "why_it_matters": "This task directly supports...",
    "checklist": [
      {
        "id": "checklist_123",
        "text": "Review current status...",
        "completed": false,
        "created_at": "2025-01-27T..."
      }
    ],
    "backlog": [
      {
        "id": "backlog_123",
        "idea": "New feature idea",
        "added_at": "2025-01-27T...",
        "priority": "medium"
      }
    ],
    "last_completed_task": "Previous task",
    "last_completed_at": "2025-01-26T...",
    "next_review_time": "2025-01-28T..."
  }
}
```

## Example Interactions

### Example 1: Setting Initial Priority

**User:** "I want to focus on growing my YouTube channel subscribers"

**Marcus:**
```
Priority set: growing YouTube channel subscribers

---
NEXT TASK: Review current YouTube channel analytics and identify top growth opportunity

WHY IT MATTERS: This task directly supports growing YouTube channel subscribers. Completing it will move us closer to measurable YouTube growth metrics. Focus here prevents distraction and ensures progress on our single active priority.

TODAY'S CHECKLIST:
- [ ] Review current status related to: growing YouTube channel subscribers
- [ ] Break down "Review current YouTube channel analytics..." into actionable steps
- [ ] Identify any blockers or dependencies
- [ ] Set specific completion criteria
- [ ] Allocate time and resources needed
- [ ] Export key metrics from YouTube Analytics
- [ ] Compare current period vs previous period
- [ ] Identify top 3 performing videos

---
Active Priority: growing YouTube channel subscribers
```

### Example 2: Scope Creep Detection

**User:** "Also, I was thinking about maybe adding a new feature for live streaming"

**Marcus:**
```
Noted. Added to backlog.

Back to active_priority: growing YouTube channel subscribers

---
NEXT TASK: Review current YouTube channel analytics and identify top growth opportunity

WHY IT MATTERS: This task directly supports growing YouTube channel subscribers...

TODAY'S CHECKLIST:
- [ ] Review current status...
...

---
Active Priority: growing YouTube channel subscribers

Backlog: 1 item(s) pending
```

### Example 3: Giorgio Delegation

**User:** "Ask Giorgio to generate a Sora prompt for my next music video"

**Marcus:**
```
GIORGIO OUTPUT:
[Sora prompt generated by Giorgio]

NEXT: Review output and determine next task based on active priority: growing YouTube channel subscribers

---
NEXT TASK: Review current YouTube channel analytics...

...
```

## Database Schema

See migration: `frontend/supabase/migrations/0013_marcus_manager_state.sql`

**Table:** `marcus_manager_state`

**Columns:**
- `id` (UUID, primary key)
- `user_id` (TEXT, unique per user)
- `active_priority` (TEXT)
- `today_task` (TEXT)
- `why_it_matters` (TEXT)
- `checklist` (JSONB array)
- `backlog` (JSONB array)
- `last_completed_task` (TEXT)
- `last_completed_at` (TIMESTAMPTZ)
- `next_review_time` (TIMESTAMPTZ)
- `metadata` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

## Integration with Other Agents

### Giorgio Integration

Marcus can delegate to Giorgio with bounded requests:
- Single deliverable at a time
- Timeboxed constraints
- Format specifications
- Marcus decides next steps based on output

### Override Behavior

When other agents (like the original Marcus orchestrator) suggest conflicting priorities:
- Marcus Manager's `active_priority` takes precedence
- Other agents are redirected to active priority
- Ensures single focus is maintained

## Implementation Files

- **Agent:** `frontend/src/agents/marcusManager/marcusManagerAgent.ts`
- **Actions:** `frontend/src/agents/marcusManager/marcusManagerActions.ts`
- **System Prompt:** `frontend/src/agents/marcusManager/marcusManagerSystemPrompt.ts`
- **API Route:** `frontend/src/app/api/agents/marcus-manager/route.ts`
- **Migration:** `frontend/supabase/migrations/0013_marcus_manager_state.sql`

## Testing

### Manual Testing

1. **Set Initial Priority:**
```bash
curl -X POST http://localhost:3000/api/agents/marcus-manager \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to focus on improving YouTube analytics",
    "userId": "test_user"
  }'
```

2. **Test Scope Creep:**
```bash
curl -X POST http://localhost:3000/api/agents/marcus-manager \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Also, maybe we could add a new feature for live streaming",
    "userId": "test_user"
  }'
```

3. **Test Task Completion:**
```bash
curl -X POST http://localhost:3000/api/agents/marcus-manager \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Done reviewing analytics",
    "userId": "test_user"
  }'
```

4. **Get State:**
```bash
curl http://localhost:3000/api/agents/marcus-manager?userId=test_user
```

## Notes

- Marcus Manager is separate from the original Marcus orchestrator agent
- Designed specifically for YouTube music growth focus
- Enforces strict single-priority discipline
- Automatically prevents scope creep
- Maintains persistent state across sessions

