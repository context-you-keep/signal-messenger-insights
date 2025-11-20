# v0 Template Integration Plan

## Overview

This document outlines the plan to integrate the v0-designed template with Signal-themed 3-pane layout and statistics sidebar into the current Signal Archive Viewer codebase.

**Template Location**: `/tmp/signal-vercel-template/signal-archive-viewer/`

**Goal**: Transform the current 2-pane layout (ConversationList + MessageView) into a 3-pane layout (ConversationList + MessageView + ChatStatistics) with authentic Signal dark theme.

---

## Component Mapping

### New Components to Create

1. **`frontend/src/components/ChatStatistics.tsx`**
   - Source: `/tmp/signal-vercel-template/signal-archive-viewer/components/chat-statistics.tsx`
   - Purpose: Right sidebar displaying conversation statistics
   - Features:
     - "Chat Overview" card with basic statistics
     - "AI Insights" card (placeholder for future LLM integration)
     - Link to full stats page (`/stats/{conversationId}`)
   - Dependencies: Card, Separator from shadcn/ui, lucide-react icons (MessageSquare, Sparkles, ChevronRight)

2. **`frontend/src/components/ConversationHeader.tsx`**
   - Source: `/tmp/signal-vercel-template/signal-archive-viewer/components/conversation-header.tsx`
   - Purpose: Header bar above message view with conversation name, avatar, actions
   - Features:
     - Avatar with fallback
     - Conversation name and status ("Last seen recently" / "{N} members")
     - Action buttons (Phone, Video, More - non-functional for archive viewer)
   - Dependencies: Avatar, Button from shadcn/ui, lucide-react icons

### Components to Modify

1. **`frontend/src/components/App.tsx`**
   - Changes needed:
     - Update layout from 2-pane to 3-pane (add ChatStatistics sidebar)
     - Add ConversationHeader above MessageView
     - Update to use Signal CSS variables instead of generic shadcn variables
     - Pass conversation and messages data to ChatStatistics component

2. **`frontend/src/components/MessageView.tsx`**
   - Changes needed:
     - Update colors to use Signal CSS variables (--signal-bg-primary, --signal-message-sent, etc.)
     - Ensure matches Signal theme aesthetic

3. **`frontend/src/components/ConversationList.tsx`**
   - Changes needed:
     - Update colors to use Signal CSS variables
     - Ensure visual consistency with new Signal theme

---

## CSS Integration

### Add Signal Theme Variables

**File**: `frontend/src/index.css`

Add Signal-specific CSS variables to both `:root` and `.dark` sections:

```css
:root {
  /* Signal-specific tokens */
  --signal-bg-primary: oklch(0.125 0.008 255); /* #1b1c1f */
  --signal-bg-secondary: oklch(0.18 0.01 255); /* #2c2e3b */
  --signal-bg-tertiary: oklch(0.16 0.009 255); /* #25262f */
  --signal-blue: oklch(0.52 0.18 255.5); /* #3a76f0 */
  --signal-blue-hover: oklch(0.48 0.18 255.5);
  --signal-message-sent: oklch(0.52 0.18 255.5);
  --signal-message-received: oklch(0.18 0.01 255);
  --signal-text-primary: oklch(0.95 0 0);
  --signal-text-secondary: oklch(0.65 0.01 255);
  --signal-text-tertiary: oklch(0.5 0.01 255);
  --signal-divider: oklch(0.22 0.01 255);
}

.dark {
  /* Signal-specific dark tokens (same as above - Signal is dark-first) */
  --signal-bg-primary: oklch(0.125 0.008 255);
  --signal-bg-secondary: oklch(0.18 0.01 255);
  --signal-bg-tertiary: oklch(0.16 0.009 255);
  --signal-blue: oklch(0.52 0.18 255.5);
  --signal-blue-hover: oklch(0.48 0.18 255.5);
  --signal-message-sent: oklch(0.52 0.18 255.5);
  --signal-message-received: oklch(0.18 0.01 255);
  --signal-text-primary: oklch(0.95 0 0);
  --signal-text-secondary: oklch(0.65 0.01 255);
  --signal-text-tertiary: oklch(0.5 0.01 255);
  --signal-divider: oklch(0.22 0.01 255);
}
```

### Tailwind Configuration

**File**: `frontend/tailwind.config.js`

Add Signal color extensions to theme:

```javascript
theme: {
  extend: {
    colors: {
      // ... existing shadcn colors ...

      // Signal custom colors
      'signal-bg-primary': 'var(--signal-bg-primary)',
      'signal-bg-secondary': 'var(--signal-bg-secondary)',
      'signal-bg-tertiary': 'var(--signal-bg-tertiary)',
      'signal-blue': 'var(--signal-blue)',
      'signal-blue-hover': 'var(--signal-blue-hover)',
      'signal-message-sent': 'var(--signal-message-sent)',
      'signal-message-received': 'var(--signal-message-received)',
      'signal-text-primary': 'var(--signal-text-primary)',
      'signal-text-secondary': 'var(--signal-text-secondary)',
      'signal-text-tertiary': 'var(--signal-text-tertiary)',
      'signal-divider': 'var(--signal-divider)',
    },
  },
}
```

---

## TypeScript Types

### Update Conversation Type

**File**: `frontend/src/types.ts` (or wherever types are defined)

Ensure Conversation type includes:

```typescript
export interface Conversation {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  avatar?: string
  unread?: number
  isGroup?: boolean
}
```

### Update Message Type

Ensure Message type includes:

```typescript
export interface Message {
  id: string
  content: string
  timestamp: string
  sender: string
  isSent: boolean
  status?: 'sent' | 'delivered' | 'read'
  avatar?: string
}
```

---

## Backend API Requirements

### New Endpoints Needed

1. **`GET /api/conversations/{id}/statistics`**

   **Purpose**: Provide statistics data for ChatStatistics component

   **Response format**:
   ```json
   {
     "conversationId": "string",
     "totalMessages": 0,
     "sentMessages": 0,
     "receivedMessages": 0,
     "firstMessageDate": "2024-01-15T10:30:00Z",
     "lastMessageDate": "2024-01-20T14:45:00Z",
     "talkMorePercentage": 55
   }
   ```

   **Implementation notes**:
   - Query Signal database for conversation message counts
   - Filter messages by `is_outgoing` field (sent vs received)
   - Get MIN(sent_at) and MAX(sent_at) for date range
   - Calculate percentage: `(sentMessages / totalMessages) * 100`

2. **Update `GET /api/conversations/{id}/messages`**

   **Current**: Returns basic message data

   **Enhancement needed**: Ensure includes `isSent` field (mapped from Signal's `is_outgoing`)

   **Response enhancement**:
   ```json
   {
     "messages": [
       {
         "id": "string",
         "content": "string",
         "timestamp": "ISO-8601",
         "sender": "string",
         "isSent": true,  // <- Ensure this is included
         "status": "read"
       }
     ]
   }
   ```

### Database Queries

**Statistics calculation query**:

```sql
SELECT
  COUNT(*) as total_messages,
  SUM(CASE WHEN is_outgoing = 1 THEN 1 ELSE 0 END) as sent_messages,
  SUM(CASE WHEN is_outgoing = 0 THEN 1 ELSE 0 END) as received_messages,
  MIN(sent_at) as first_message_date,
  MAX(sent_at) as last_message_date
FROM messages
WHERE conversation_id = ?
```

---

## Integration Checklist

### Phase 1: CSS and Theme Setup (10 min)

- [ ] Add Signal CSS variables to `frontend/src/index.css` (both `:root` and `.dark`)
- [ ] Add Signal color extensions to `frontend/tailwind.config.js`
- [ ] Test theme variables are accessible
- [ ] Commit: "Add Signal theme CSS variables"

### Phase 2: Create New Components (15 min)

- [ ] Install missing lucide-react icons if needed: `Sparkles`, `ChevronRight`, `Phone`, `Video`, `MoreVertical`
- [ ] Create `frontend/src/components/ConversationHeader.tsx` (copy and adapt from template)
- [ ] Create `frontend/src/components/ChatStatistics.tsx` (copy and adapt from template)
- [ ] Update imports to use our existing types
- [ ] Commit: "Add ConversationHeader and ChatStatistics components"

### Phase 3: Update App Layout (15 min)

- [ ] Update `App.tsx` to 3-pane layout
- [ ] Add ConversationHeader above MessageView
- [ ] Add ChatStatistics as right sidebar (width: 320px / w-80)
- [ ] Ensure proper flex layout: `flex h-screen`
- [ ] Update to use Signal CSS variables for background colors
- [ ] Test layout responsiveness
- [ ] Commit: "Implement 3-pane layout with statistics sidebar"

### Phase 4: Update Existing Components (10 min)

- [ ] Update `MessageView.tsx` to use Signal CSS variables
- [ ] Update `ConversationList.tsx` to use Signal CSS variables
- [ ] Update message bubbles to use `--signal-message-sent` and `--signal-message-received`
- [ ] Commit: "Apply Signal theme to all components"

### Phase 5: Backend API Integration (20 min)

- [ ] Create `/api/conversations/{id}/statistics` endpoint in FastAPI backend
- [ ] Implement database query for statistics calculation
- [ ] Add endpoint to `backend/app/api/routes.py`
- [ ] Test endpoint returns correct data
- [ ] Commit: "Add conversation statistics API endpoint"

### Phase 6: Wire Up Frontend to Backend (15 min)

- [ ] Update `ChatStatistics.tsx` to fetch data from API
- [ ] Replace hardcoded placeholder dates with real data
- [ ] Add loading states while fetching
- [ ] Handle error states
- [ ] Format dates properly (using date-fns or similar)
- [ ] Commit: "Connect ChatStatistics to backend API"

### Phase 7: Testing and Polish (15 min)

- [ ] Test with real Signal database
- [ ] Verify statistics calculations are accurate
- [ ] Test responsive behavior (what happens on narrow screens?)
- [ ] Ensure dark theme works correctly
- [ ] Test all components in HMR dev mode
- [ ] Build Docker container and test production build
- [ ] Commit: "Polish and test statistics integration"

---

## Data Flow

```
User clicks conversation
  ↓
App.tsx updates selectedConversation state
  ↓
Triggers two parallel API calls:
  1. GET /api/conversations/{id}/messages → MessageView
  2. GET /api/conversations/{id}/statistics → ChatStatistics
  ↓
Both components update with new data
```

---

## Potential Issues and Solutions

### Issue 1: Statistics Calculation Performance

**Problem**: Calculating statistics on every conversation click might be slow for large conversations

**Solutions**:
- Cache statistics in backend (invalidate on new messages)
- Calculate statistics asynchronously
- Store pre-calculated statistics in database

**MVP Approach**: Calculate on-demand, optimize later if needed

### Issue 2: Timestamp Formatting

**Problem**: Signal database stores timestamps in Unix milliseconds

**Solution**:
- Backend returns ISO-8601 format
- Frontend uses date-fns or built-in Intl.DateTimeFormat
- ChatStatistics formats as "Jan 15, 2024 10:30 AM"

### Issue 3: Group Conversations

**Problem**: Template assumes 1:1 conversations, but Signal has group chats

**Solution**:
- "Who talks more?" only shown for 1:1 conversations
- Group conversations show "Group activity: X% you, Y% others"
- Use `conversation.isGroup` to conditionally render

### Issue 4: Missing Avatar Images

**Problem**: Signal conversations might not have avatar images

**Solution**:
- ConversationHeader uses AvatarFallback (first letter of name)
- Template already handles this: `<AvatarFallback>{name.charAt(0)}</AvatarFallback>`

### Issue 5: Mobile Responsiveness

**Problem**: 3-pane layout won't fit on mobile screens

**Solution** (future enhancement):
- Hide ChatStatistics sidebar on mobile (< 1024px)
- Show statistics as modal/sheet when user clicks info button
- Use Tailwind responsive classes: `hidden lg:flex` on sidebar

**MVP Approach**: Desktop-first, mobile enhancement later

---

## Visual Reference

### v0 Template Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ConversationList  │    MessageView    │  ChatStatistics   │
│                    │                    │                    │
│  - Alice Johnson   │  ┌─────────────┐  │  ┌──────────────┐ │
│  - Bob Smith       │  │ Header      │  │  │ Statistics   │ │
│  - Team Updates    │  └─────────────┘  │  │ ────────────  │ │
│  - Sarah Williams  │                    │  │ Total: 1,234 │ │
│  - Design Team     │  ┌─────────────┐  │  │ Sent: 600    │ │
│                    │  │ Messages    │  │  │ Received: 634│ │
│                    │  │ ─────────── │  │  │              │ │
│                    │  │ [Messages]  │  │  │ ────────────  │ │
│                    │  │             │  │  │ AI Insights  │ │
│                    │  │             │  │  │ (pending)    │ │
│                    │  └─────────────┘  │  └──────────────┘ │
│                    │                    │                    │
└──────────────────────────────────────────────────────────────┘
```

### CSS Variable Usage Pattern

Replace generic colors:
```typescript
// Old (generic shadcn)
className="bg-background border-border text-foreground"

// New (Signal-themed)
className="bg-[var(--signal-bg-primary)] border-[var(--signal-divider)] text-[var(--signal-text-primary)]"
```

---

## Files Modified Summary

### New Files
- `frontend/src/components/ChatStatistics.tsx`
- `frontend/src/components/ConversationHeader.tsx`
- `backend/app/api/routes.py` (new endpoint)

### Modified Files
- `frontend/src/index.css` (Signal CSS variables)
- `frontend/tailwind.config.js` (Signal color extensions)
- `frontend/src/components/App.tsx` (3-pane layout)
- `frontend/src/components/MessageView.tsx` (Signal theme colors)
- `frontend/src/components/ConversationList.tsx` (Signal theme colors)

### Documentation
- `docs/v0-template-integration-plan.md` (this file)

---

## Next Steps (Post-Integration)

1. **Implement AI Insights** (Phase 2 from conversation-analytics-features.md)
   - Connect to LLM API (Claude, OpenAI, or local model)
   - Analyze conversation patterns, sentiment, topics
   - Display in "AI Insights" card

2. **Full Statistics Page** (`/stats/{conversationId}`)
   - Create dedicated page for detailed analytics
   - Implement charts and visualizations
   - Add all metrics from conversation-analytics-features.md

3. **Export Statistics**
   - Allow users to export statistics as PDF or JSON
   - Include charts and insights

4. **Mobile Responsive Design**
   - Hide/show panels based on screen size
   - Make statistics accessible via modal on mobile

---

## Estimated Time

- **Total integration time**: ~90 minutes
- **Broken down**:
  - CSS setup: 10 min
  - Components: 15 min
  - Layout: 15 min
  - Theme updates: 10 min
  - Backend API: 20 min
  - Frontend wiring: 15 min
  - Testing: 15 min

---

## Success Criteria

✅ 3-pane layout working (ConversationList + MessageView + ChatStatistics)

✅ Signal dark theme applied consistently across all components

✅ Statistics display real data from Signal database

✅ Calculations accurate (total, sent, received, percentage, dates)

✅ HMR working for instant visual iteration

✅ Docker production build working

✅ No console errors or warnings

✅ Responsive layout (desktop-first, mobile TBD)

---

*This integration plan created 2025-11-20 for Signal Archive Viewer v0 template integration.*
