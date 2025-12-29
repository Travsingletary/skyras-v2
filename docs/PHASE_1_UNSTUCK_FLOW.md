# Phase 1 Unstuck Flow: Value Before Login

**Date:** 2025-01-28  
**Insight:** Immediate login creates friction before value. Users should feel less overwhelmed BEFORE being asked to sign up.

---

## Flow Design

### 1. Public Unstuck Entry (`/`)

**Purpose:** Deliver value immediately, no authentication required.

**Features:**
- Single textarea: "What do you need help with?"
- Same one-step-at-a-time philosophy
- No saving, no memory, no history
- Deliver ONE next action immediately
- Constraint cue: "We focus on one step at a time to reduce overwhelm."

**User Experience:**
1. User lands on `/`
2. Sees simple prompt: "What do you need help with?"
3. Types question/request
4. Receives one clear next action
5. **No login required** - value delivered first

### 2. Login Prompt (After Action Delivered)

**Trigger:** After user receives their next action

**Message:**
- "Want to save this and get the next step when you come back?"
- "Sign up to keep your progress and continue where you left off."
- Button: "Sign Up to Continue"
- Note: "Or continue without saving (this action won't be remembered)"

**Design Principles:**
- Login feels like a benefit, not a barrier
- User has already received value
- Clear value proposition: save progress, continue later

### 3. Studio (`/studio`) - Authenticated Continuation

**Purpose:** Authenticated space with memory, history, and ongoing next actions.

**Features:**
- Memory: Previous actions saved
- History: Past conversations and plans
- Ongoing next actions: Continue from where you left off
- Header: "Your saved progress. Continue where you left off."

**User Experience:**
1. User signs up after getting value
2. Redirected to `/studio`
3. Sees their saved progress
4. Can continue getting next actions
5. History preserved

---

## Technical Implementation

### Public Chat API

**Route:** `/api/chat`  
**Authentication:** Optional (supports `userId: 'public'`)

**Flow:**
1. Unauthenticated user calls `/api/chat` with `userId: 'public'`
2. API processes request (no auth required)
3. Returns one clear next action
4. No saving to database (ephemeral)

### Authenticated Chat API

**Route:** `/api/chat`  
**Authentication:** Required (Supabase session)

**Flow:**
1. Authenticated user calls `/api/chat`
2. API processes request with user session
3. Returns one clear next action
4. Saves to database (memory, history)

---

## User Journey

### First-Time User (Unstuck Flow)

1. **Land on `/`**
   - Sees: "What do you need help with?"
   - No login required
   - Simple, clear interface

2. **Get Next Action**
   - Types question
   - Receives one clear next action
   - Feels unstuck immediately

3. **Login Prompt Appears**
   - "Want to save this and get the next step when you come back?"
   - Login feels like benefit, not barrier

4. **Sign Up (Optional)**
   - Redirects to `/studio`
   - Progress saved
   - Can continue later

### Returning User (Studio Flow)

1. **Land on `/studio`**
   - Sees: "Your saved progress. Continue where you left off."
   - Previous actions visible
   - Can continue from where they left off

2. **Get Next Action**
   - Types question
   - Receives one clear next action
   - Action saved to history

---

## Key Principles

### ✅ Value Before Login
- User receives value (next action) before being asked to sign up
- Login feels like benefit, not barrier
- Reduces friction and overwhelm

### ✅ No Saving Without Login
- Public flow: No saving, no memory, no history
- Ephemeral: Action delivered but not remembered
- Clear expectation: "No saving, no memory, no history."

### ✅ Login as Benefit
- "Want to save this and get the next step when you come back?"
- Clear value proposition
- Optional, not required

### ✅ Studio as Continuation
- Authenticated space with memory
- History preserved
- Ongoing next actions

---

## Files Changed

- `frontend/src/app/page.tsx` - Transformed into public unstuck entry point
- `frontend/src/components/UnstuckPrompt.tsx` - New component for login prompt
- `frontend/src/app/studio/page.tsx` - Updated header to clarify continuation space

---

## Validation Goals

**Primary Metric:** Users feel less overwhelmed BEFORE being asked to sign up.

**Success Criteria:**
- ✅ User receives next action without login
- ✅ User understands value before seeing login prompt
- ✅ Login prompt appears after value is delivered
- ✅ Login feels like benefit, not barrier

---

**Status:** ✅ **IMPLEMENTED - READY FOR VALIDATION**
