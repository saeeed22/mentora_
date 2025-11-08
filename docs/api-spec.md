# Mentor Connect KU - API Spec (Frontend Mock → Future Backend)

This document lists the endpoints the frontend expects. Replace mock services with real API using similar shapes.

Conventions
- Base URL: https://api.server.com (to be provided)
- All requests/responses are JSON: Content-Type: application/json
- Timezone: All datetimes are ISO 8601 UTC strings (e.g., 2025-10-18T09:30:00Z)
- IDs: UUID strings (recommended) or numeric IDs (consistent across API)
- Auth: Bearer token in Authorization header unless noted

Headers
- Authorization: Bearer <jwt>
- Content-Type: application/json

Errors
- Error response format:
```
{
  "error": {
    "code": "VALIDATION_ERROR", // or UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT
    "message": "Human-readable message",
    "details": { /* optional field-level errors */ }
  }
}
```
- Typical status codes: 200/201/204 success; 400 validation; 401 auth; 403 access; 404 not found; 409 conflict; 429 rate limit; 500 server

Pagination
- Query params: page (1-based), limit (default 20, max 100), sort (e.g., rating:desc), filters vary per resource
- Paged response wrapper:
```
{
  "data": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 128,
  "hasNext": true
}
```

## Auth
- POST /auth/login
  - body: { email, password }
  - 200: { user }
- POST /auth/signup
  - body: { name, email, password, role }
  - 201: { user }
- POST /auth/reset-password
  - body: { email }
  - 200
- GET /auth/me
  - 200: { user }

## Users / Profile
- GET /users/:id
  - 200: User
- PATCH /users/:id
  - body: Partial<User>
  - 200: User

Access control
- GET /users/:id: self or admin
- PATCH /users/:id: self or admin

Examples
Request:
```
PATCH /users/abc123
{
  "name": "Ayesha Khan",
  "title": "Senior Software Engineer",
  "company": "Google",
  "location": "San Francisco, CA",
  "expertise": ["React", "System Design"]
}
```
Response 200:
```
{
  "id": "abc123",
  "email": "mentor@ku.edu.pk",
  "name": "Ayesha Khan",
  "role": "mentor",
  "avatar": "/avatars/mentor1.jpg",
  "bio": "...",
  "expertise": ["React", "System Design"],
  "company": "Google",
  "title": "Senior Software Engineer",
  "location": "San Francisco, CA"
}
```

User summary (subset):
```
User {
  id: string
  email: string
  name: string
  role: 'mentor' | 'mentee'
  avatar?: string
  bio?: string
  expertise?: string[]
  company?: string
  title?: string
  location?: string
}
```

## Mentors
- GET /mentors
  - 200: MentorProfile[]
- GET /mentors/:id
  - 200: MentorProfile
- GET /mentors/:id/availability
  - 200: AvailabilitySlot[]
- POST /mentors/:id/feedback
  - body: { rating: number }
  - 204

MentorProfile summary (subset): rating:number, reviewCount:number, availability_slots:AvailabilitySlot[]

Querying mentors
- Filters (optional): expertise, company, location, isOnline, availability (today|week), ratingMin
- Sorting (optional): rating, sessionsCompleted, responseTime, name
Example:
```
GET /mentors?expertise=React&ratingMin=4.5&sort=rating:desc&page=1&limit=24
```

## Availability (mentor)
- GET /availability/:mentorId
  - 200: AvailabilitySchedule
- PUT /availability/:mentorId
  - body: AvailabilitySchedule
  - 204

```
AvailabilitySchedule {
  timezone: string
  weeklySchedule: Record<Day, { enabled: boolean, slots: { start: 'HH:mm', end: 'HH:mm' }[] }>
  blockedDates: string[] // YYYY-MM-DD
  sessionDuration: number // minutes
  bufferTime: number // minutes
  maxSessionsPerDay: number
  autoAcceptBookings: boolean
}

AvailabilitySlot { date: 'YYYY-MM-DD', dayName: 'MON'|'TUE'|..., slots: string[] }
```

## Bookings
- GET /bookings?userId=...&role=mentor|mentee
  - 200: Booking[]
- GET /bookings/:id
  - 200: Booking
- POST /bookings
  - body: { mentorId, menteeId, datetime: ISO, durationMin, sessionType, topic, goals? }
  - 201: Booking (with videoCallLink)
- PATCH /bookings/:id/status
  - body: { status: 'cancelled'|'completed'|'confirmed' }
  - 200: Booking
- POST /bookings/:id/feedback
  - body: { rating: number, comment?: string }
  - 204

Access control
- GET /bookings: only returns bookings where requester is mentorId or menteeId; admin can pass userId for others
- GET /bookings/:id: requester must be participant or admin
- POST /bookings: requester must be menteeId == self
- PATCH status: only mentor (owner) can confirm/complete; either party can cancel
- POST feedback: only mentee participant; one feedback per booking

Examples
Request:
```
POST /bookings
{
  "mentorId": "m1",
  "menteeId": "u3",
  "datetime": "2025-10-18T09:30:00Z",
  "durationMin": 60,
  "sessionType": "Resume Review",
  "topic": "Improve my resume",
  "goals": "Target internships"
}
```
Response 201:
```
{
  "id": "bk_9fd12ab3",
  "mentorId": "m1",
  "menteeId": "u3",
  "datetime": "2025-10-18T09:30:00Z",
  "durationMin": 60,
  "sessionType": "Resume Review",
  "topic": "Improve my resume",
  "goals": "Target internships",
  "status": "confirmed",
  "videoCallLink": "https://meet.jit.si/mentora-bk_9fd12ab3",
  "createdAt": "2025-10-10T08:00:00Z",
  "updatedAt": "2025-10-10T08:00:00Z"
}
```

```
Booking {
  id: string
  mentorId: string
  menteeId: string
  datetime: ISO
  durationMin: number
  sessionType: string
  topic: string
  goals?: string
  status: 'pending'|'confirmed'|'completed'|'cancelled'
  videoCallLink?: string
  feedback?: { rating: number, comment?: string, givenByUserId: string, createdAt: ISO }
}
```

## Messages
- GET /conversations?userId=...
  - 200: Conversation[]
- GET /conversations/:id/messages
  - 200: Message[]
- POST /conversations
  - body: { mentorId, menteeId, bookingId? }
  - 201: Conversation
- POST /messages
  - body: { conversationId, senderUserId, content }
  - 201: Message

Notes
- Conversations are unique by (mentorId, menteeId, bookingId?) — POST should be idempotent and return existing conversation if present.
- Messages returned ordered ascending by createdAt.

Examples
Create/retrieve a conversation
```
POST /conversations
{
  "mentorId": "m1",
  "menteeId": "u3",
  "bookingId": "bk_9fd12ab3"
}
```
Response 201:
```
{
  "id": "cv_a12b3c45",
  "mentorId": "m1",
  "menteeId": "u3",
  "bookingId": "bk_9fd12ab3",
  "createdAt": "2025-10-10T09:00:00Z",
  "lastMessageAt": null
}
```

Send a message
```
POST /messages
{
  "conversationId": "cv_a12b3c45",
  "senderUserId": "u3",
  "content": "Hi! Looking forward to our session."
}
```
Response 201:
```
{
  "id": "msg_4d3c2b1a",
  "conversationId": "cv_a12b3c45",
  "senderUserId": "u3",
  "content": "Hi! Looking forward to our session.",
  "type": "text",
  "createdAt": "2025-10-10T09:05:00Z"
}
```

```
Conversation { id, mentorId, menteeId, bookingId?, createdAt: ISO, lastMessageAt?: ISO }
Message { id, conversationId, senderUserId, content, type: 'text'|'system', createdAt: ISO }
```

## Sessions
- GET /sessions/:bookingId
  - 200: { joinUrl: string }

Access control
- Only participants (mentorId or menteeId) for the booking can retrieve the joinUrl.

Example
```
GET /sessions/bk_9fd12ab3
Authorization: Bearer <jwt>

200 { "joinUrl": "https://meet.jit.si/mentora-bk_9fd12ab3" }
```

Notes
- Auth via Bearer token (to be added).
- Errors: 4xx with { error: string }.
- All dates are ISO strings, times in UTC; client displays in local timezone.

Security & Roles
- Roles: mentor, mentee, admin
- Backend should verify access rules noted per section.

Performance
- Endpoints that list resources SHOULD support pagination & filters as above.
- Caching headers for public mentor data are recommended.

