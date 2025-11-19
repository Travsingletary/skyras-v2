# Marcus Onboarding & Workflow System

## Overview

Marcus now acts as a personalized workflow builder for content creators, marketers, and freelancers. When a new user arrives, Marcus:

1. **Onboards them** with 5 targeted questions
2. **Proposes workflows** tailored to their answers
3. **Generates weekly structures** and task breakdowns
4. **Saves their workflow** for future reference
5. **Adapts responses** based on their saved workflow

## Onboarding Flow

### Questions Asked

1. **Role**: "What do you do? (freelance creator, agency, in-house, etc.)"
2. **Platforms**: "Which platforms matter most to you? (IG, TikTok, YouTube, LinkedIn, etc.)"
3. **Time**: "How many hours per week can you realistically put into content/marketing?"
4. **Goal**: "Are you focused more on: (A) getting clients, (B) growing audience, or (C) launching products?"
5. **Content Type**: "Do you already have long-form content (pods, YT vids, lives), or mostly short content?"

### Workflow Types Generated

Based on answers, Marcus proposes:

- **Client Content System**: For freelancers/agencies focused on client work
- **Weekly Content Engine**: For solo creators focused on audience growth
- **Launch Plan**: For product launches and campaigns

### Weekly Structure Example

```
MON: Plan hooks & scripts (2h, must-do)
TUE: Batch record content (2-4h, must-do)
WED: Edit & schedule posts (2h, must-do)
THU: Engagement & DMs (1h, nice-to-have)
FRI: Analytics review (30min, nice-to-have)
```

## Database Schema Requirements

The `conversations` table needs these columns:

```sql
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS onboarding_state JSONB,
ADD COLUMN IF NOT EXISTS workflow JSONB;
```

The `onboarding_state` stores:
- `answers`: Object with user's answers to the 5 questions
- `currentQuestion`: Number of current question (1-5)
- `awaitingConfirmation`: Boolean
- `awaitingWorkflowChoice`: Boolean
- `completed`: Boolean
- `proposals`: Array of workflow proposals

The `workflow` stores:
- `name`: Workflow name
- `weeklyStructure`: Array of day objects with tasks, time, priority
- `taskBreakdown`: Array of category objects with tasks
- `answers`: Original onboarding answers
- `createdAt`: ISO timestamp

## Behavior After Onboarding

Once a user completes onboarding:

- Marcus references their workflow in responses
- "Given your [Workflow Name], how can I help?"
- Context-aware responses based on workflow
- Can adjust workflow or add new elements

## Files Modified

- `server.js`: Updated `/api/chat` endpoint with full onboarding flow
- `backend/marcusWorkflows.js`: New module with workflow generation logic
- `frontend/src/app/page.tsx`: Updated to render markdown in messages

## Testing

1. Start backend: `node server.js`
2. Open frontend: `http://localhost:3000`
3. Send first message → Should start onboarding
4. Answer 5 questions → Should get workflow proposals
5. Choose workflow → Should get full weekly structure
6. Send follow-up message → Should reference workflow

## Future Enhancements

- Move workflow storage to dedicated `user_workflows` table
- Add workflow editing/updating
- Track workflow performance
- Suggest workflow improvements based on usage

