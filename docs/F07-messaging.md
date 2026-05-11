# F07 — In-Portal Messaging

| Field | Value |
|-------|-------|
| **Feature ID** | F07 |
| **Phase** | Phase 1 — MVP |
| **Type** | Full-stack |
| **Stack** | Express, Socket.io, Next.js, Prisma |
| **Depends on** | F01, F02, F03, F04 |
| **Blocks** | F10, F11 |

---

## Overview

Threaded real-time messaging between the complainant and the Grievance Committee within the context of a specific grievance. All messages logged permanently. Anonymous grievances display committee member as their role only (no name shown to complainant).

---

## API Endpoints

### POST /api/v1/grievances/:id/messages

**Auth**: `requireAuth` (complainant of grievance OR committee member)

**Request**: `{ "body": "Please provide your supplementary exam marksheet." }`

**Validation**: body 1–2000 characters; grievance must not be CLOSED

**Logic**
1. Validate access: user is complainant OR committee member
2. Save `Message` to DB
3. Emit Socket.io event to room `grievance:{id}`
4. Dispatch notification job: `event=MESSAGE_RECEIVED` to other party
5. Return saved message with sender info

---

### GET /api/v1/grievances/:id/messages

**Auth**: `requireAuth`

Returns all messages ordered by `createdAt ASC`.

**Privacy**: If grievance is anonymous, committee sender names are shown; complainant-side shows "Complainant" label only.

---

## WebSocket (Socket.io)

**Authentication**: JWT passed as `auth.token` in socket handshake.

```ts
// Client connection
const socket = io(BACKEND_URL, {
  auth: { token: localStorage.getItem('accessToken') }
});
socket.emit('join', grievanceId);
socket.on('new_message', (message) => { /* append to thread */ });
```

**Server events**

| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | Client → Server | `grievanceId` |
| `new_message` | Server → Client | `{ id, body, sender, createdAt }` |
| `typing` | Client → Server | `{ grievanceId }` |
| `typing_indicator` | Server → Client | `{ senderRole }` |

**Room guard**: Server verifies user is complainant or committee before allowing `join`.

---

## Frontend — Message Thread Component

```
┌────────────────────────────────────────┐
│ Messages                               │
├────────────────────────────────────────┤
│                                        │
│    [Committee Member]  8 May, 9:15 AM  │
│    Please attach your marksheet.       │
│                                        │
│  You  8 May, 10:02 AM                  │
│  Attached above. Let me know.          │
│                                        │
│    [Committee Member]  8 May, 11:30 AM │
│    Thank you, reviewing now.           │
│                                        │
├────────────────────────────────────────┤
│  ┌──────────────────────────┐ [Send]   │
│  │ Type your message...     │          │
│  └──────────────────────────┘          │
└────────────────────────────────────────┘
```

- Committee bubbles: left-aligned, gray background
- Complainant bubbles: right-aligned, blue background
- Sender label: show "Committee Member" (not name) for anon cases
- Auto-scroll to bottom on new message
- Send button disabled when input is empty
- `Shift+Enter` = newline; `Enter` = send
- Typing indicator: "Committee is typing…" appears with 3s debounce

---

## Claude Code Prompt

```
Build in-portal messaging:

BACKEND:
- POST /api/v1/grievances/:id/messages (save + emit socket event + notification job)
- GET  /api/v1/grievances/:id/messages (all messages, privacy-aware sender labels)
- Socket.io server in /backend/socket.ts:
  - JWT auth via handshake
  - join room: verify access then socket.join("grievance:{id}")
  - on new message: emit to room
  - typing indicator events

FRONTEND:
- /components/MessageThread.tsx — full chat UI component
  - Fetch messages on mount via SWR
  - Socket.io client: join room, append new_message events
  - Chat bubbles: left (committee) / right (complainant)
  - Textarea input: Enter to send, Shift+Enter for newline
  - Typing indicator with debounce
  - Auto-scroll ref on new messages
```

---

## Tests

### Integration — Send message
- **What**: POST creates DB record and returns saved message
- **Assert**: Response `message.body === requestBody`; DB record exists with correct `grievanceId`

### Integration — Access control
- **What**: Third-party user cannot send or read messages on another's grievance
- **Assert**: 403 on both POST and GET for non-participant user

### Unit — Socket auth
- **What**: Socket connection without valid JWT is rejected
- **Assert**: Connection event not fired; server emits `error: { message: "Unauthorized" }`

### E2E — Real-time delivery
- **What**: Message sent by committee appears in complainant window without page reload
- **Flow**: Open two browser contexts (committee + complainant); committee sends message
- **Assert**: Complainant window appends message within 1 second

### E2E — Typing indicator
- **What**: Typing indicator appears when other party is typing
- **Flow**: Committee starts typing; complainant window shows "Committee is typing…"
- **Assert**: Indicator disappears after 3 seconds of inactivity

---

## Acceptance Criteria

- [ ] Messages persist in DB and survive page refresh
- [ ] Real-time delivery via Socket.io without polling
- [ ] Third parties cannot access messages of unrelated grievances
- [ ] Anonymous grievance: complainant shown as "Complainant", not by name
- [ ] Closed grievances: message input disabled
- [ ] Typing indicator works bidirectionally
