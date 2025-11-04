# Mentor Connect KU -- Final Professional Project Plan

## 1. Project Overview

**Name:** Mentor Connect KU\
**Type:** Final Year Project (FYP)\
**Mission:** Bridge the gap between KU students and industry
professionals (esp. alumni) through structured mentorship, guidance, and
career preparation.\
**Problem Solved:** Lack of industry exposure, structured mentorship,
and career preparation among graduates.\
**Solution:** A mentorship platform inspired by **ADPList.org**, with
**role-based dashboards, bookings, messaging, and community features**.

------------------------------------------------------------------------

## 2. Technical Architecture

### Frontend

-   **Next.js (v15.3.3)** -- App Router\
-   **Tailwind CSS (v3.4.1)** -- stable, not v4\
-   **Radix UI + shadcn/ui** -- accessible UI components\
-   **Lucide-react** -- icons\
-   **React Hook Form + Zod** -- form handling & validation\
-   **TypeScript** -- strict typing\
-   **Mock API handlers** -- for demo; later swapped with Django REST

### Backend (Future Integration, ❌ NOT in Scope Now)

-   Django REST Framework + PostgreSQL\
-   JWT Authentication\
-   Real-time Messaging via WebSockets\
-   File Storage (AWS S3)\
-   Email Notifications via SMTP\
-   API Docs with Swagger/OpenAPI

**For now: frontend only, all backend mocked.**

------------------------------------------------------------------------

## 3. Design System & Visual Identity

### Visual Philosophy

-   Inspired by ADPList.org → professional, approachable, clean.\
-   **Cards**: Rounded (`rounded-2xl`), subtle shadows (`shadow-md`).\
-   **Colors**:
    -   Base: White `#FFFFFF`, Neutral Grays, Black `#000000`.\
    -   Accents: Minimal professional highlights Teal Green `#077E7E`.\
    -   Restrictions: No gradients, emojis, or flashy visuals.

### Components

-   Buttons: Primary, Secondary, Ghost (shadcn)\
-   Forms: Radix form + Zod validation states\
-   Tabs: Radix Tabs (Profile, Dashboard, Bookings)\
-   Modals: Radix Dialog (Booking, Events)\
-   Navigation: Sidebar + Header with icons & labels

------------------------------------------------------------------------

## 4. Authentication System

### Landing Page

-   Navbar → Logo (left), **Login / Signup** (right)

### Signup Form

-   Fields: Name, Email, Password, Role (Mentor/Mentee via Radix
    Select)\
-   Zod validation\
-   On submit → mock auth handler → `/dashboard`

### Login Form

-   Fields: Email, Password\
-   Social login placeholders (Google / LinkedIn)\
-   On success → `/dashboard`

### Password Reset

-   Email input\
-   Mock response → "Reset link sent" (console log)

------------------------------------------------------------------------

## 5. Dashboard Layout (Post-login)

### Sidebar

-   Home (`home`)\
-   Explore (`search`)\
-   Messages (`message-circle`)\
-   Bookings (`calendar`)\
-   Profile (`user`)\
-   Events (`users`)\
-   Logout (`log-out`)\
-   Mentor-only → Availability (`clock`)

### Header

-   Logo (left)\
-   Notifications + "Book Session" button (right)

### Pages

#### 🏠 Home

-   Upcoming sessions overview\
-   Recent messages preview\
-   Profile strength widget\
-   Suggested mentors

#### 🔎 Explore

-   Mentor directory\
-   Filters (expertise, industry, availability, rating)\
-   Mentor cards → click → **opens full mentor profile page**

#### 💬 Messages

-   Conversation sidebar\
-   Chat threads (1 per booking)

#### 📅 Bookings

-   Tabs: Upcoming \| Past \| Cancelled\
-   Session cards with mentor/mentee info, time, status\
-   Actions: Join, Review, Cancel

#### 👤 Profile

-   Edit: Name, Avatar, Bio, Expertise tags\
-   Timezone & availability editor\
-   Social links (LinkedIn, Twitter, Portfolio)

#### 👥 Events

-   Join group sessions\
-   Event details modal

------------------------------------------------------------------------

## 6. Mentor Profile Page

When a user clicks a mentor card in **Explore**, they see a detailed
profile page.

### Profile Layout

-   **Header section**
    -   Profile image\
    -   Name, Title, Company, Location\
    -   Expertise tags\
    -   Availability status (e.g. "Next available: Tue 5 PM")
-   **Tabs (Radix Tabs)**
    1.  **Overview** → Bio, professional journey, expertise areas\
    2.  **Achievements** → Milestones, certifications, stats\
    3.  **Reviews** → 5-star ratings + mentee testimonials\
    4.  **Sessions** → list of upcoming/past sessions
-   **Booking Widget**
    -   Calendar picker → choose a date\
    -   Available slots list (mock JSON availability)\
    -   Session type dropdown (resume review, portfolio, interview prep,
        etc.)\
    -   Session goals text area\
    -   **"Book Session"** button → confirmation modal

------------------------------------------------------------------------

## 7. Booking Flow (Updated)

1.  **Explore → Mentor Card → Mentor Profile Page**\
2.  On profile, user reviews details across tabs (Overview,
    Achievements, Reviews, Sessions)\
3.  In booking widget:
    -   Select date → shows available slots\
    -   Pick slot + fill form (topic, goals, session type)\
    -   Confirm booking\
4.  Booking success → appears in **Bookings → Upcoming** and **Home
    dashboard**
5.  After Confirmation :Session link (video call) appears in booking details.

------------------------------------------------------------------------

## 8. Mentor Dashboard (Additional Features)

### Mentor Home

-   Next session card (mentee info + join link)\
-   Quick stats: sessions completed, mentees helped, hours mentored\
-   Feedback summary: ratings + reviews\
-   Tips/announcements banner

### Mentor Availability

-   Calendar connect placeholder (Google/Outlook)\
-   Weekly recurring schedule editor\
-   Block-out times (vacations, unavailable)\
-   Preview mentee-facing availability

### Mentor Bookings

-   Tabs: Upcoming \| Past \| Cancelled\
-   Booking cards with mentee info + notes\
-   "Join" button (mock link)

### Mentor Events

-   Create new event (title, description, capacity, time)\
-   List of events (edit/cancel past/upcoming)\
-   Attendance count + reviews

------------------------------------------------------------------------

## 9. Advanced Features (Future / Mocked Now)

-   Mentor verification system\
-   Session type selection (Resume, Portfolio, Interview, etc.)\
-   Feedback system (5-star + written reviews)\
-   Leaderboards, badges, gamification\
-   Success stories & case studies

------------------------------------------------------------------------


## 10. Session & Video Call Integration

-   Each session has a unique video_call_link.
-   Route: /session/[id].
-   Protected → only mentor & mentee can access.
-   Fetch session details (mock API).
-   Embed Jitsi Meet IFrame with unique session room.
-   ✅ Done when: Two users join the same video call through the platform.


------------------------------------------------------------------------


## 11. Project Structure

``` bash
unified-listing-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Home
│   │   ├── explore/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── events/page.tsx
│   │   ├── availability/page.tsx (mentor only)
│   ├── api/ (mock JSON endpoints)
│   └── page.tsx              # Landing page
│
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── mentor-card.tsx
│   ├── booking-modal.tsx
│   ├── message-thread.tsx
│   ├── availability-editor.tsx
│   ├── event-card.tsx
│
├── lib/
│   ├── mock-data.ts          # mentors, bookings, messages
│   ├── auth.ts               # mock login/signup
│
├── styles/
│   └── globals.css
```

------------------------------------------------------------------------

## 12. Development Approach (Cursor Instructions)

### ✅ In-Scope (Frontend)

-   Complete UI/UX with mock data\
-   Authentication flow (mocked)\
-   Dashboard for mentees + mentors\
-   Booking, messaging, profile editing, events\
-   Video call integration (Jitsi).
-   Feedback/reviews after sessions.
-   Tailwind + shadcn for consistent styling\
-   TypeScript for type safety

### ❌ Out-of-Scope (Backend)

-   Django API & DB integration\
-   Real auth + JWT\
-   WebSockets for messaging\
-   Email + file storage

👉 Mock these with **Promise-based functions** & local JSON.

------------------------------------------------------------------------

## 13. Timeline (Fast-Track)

-   **Week 1--2**: Auth + Landing + Layout\
-   **Week 3--4**: Dashboard + Explore + Booking flow\
-   **Week 5--6**: Messages + Profile + Events\
-   **Week 7--8**: Testing + polish + documentation

------------------------------------------------------------------------

## 14. Success Metrics

-   ✅ Fully working **frontend clone** of ADPList with KU branding\
-   ✅ All features functional with mock data\
-   ✅ Responsive, accessible, WCAG 2.1 AA ready\
-   ✅ Ready for backend integration with Django REST

------------------------------------------------------------------------

## 15. Deliverables

-   Full frontend app (Next.js + Tailwind + Radix + shadcn)\
-   Documentation (setup, API integration points)\
-   Demo walkthrough (auth → dashboard → mentor profile → booking →
    messages → events)\
-   Feature parity checklist against ADPList

------------------------------------------------------------------------

