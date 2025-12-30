# Availability & Booking Analysis: Missing/Extra Items

## Executive Summary
The **Availability** and **Bookings** pages are tightly integrated. The availability page lets mentors define their schedule, which the booking page (and mentor detail page) uses to let mentees reserve slots. Below is a detailed audit of what's implemented, what's missing, and what's extra.

---

## 1. AVAILABILITY PAGE ANALYSIS

### ✅ Implemented Features

#### A. General Settings
- **Timezone Selection**: Dropdown with 5 timezones (PT, MT, CT, ET, PKT)
- **Session Duration**: 30/45/60/90 minutes
- **Buffer Time**: 0/15/30/60 minutes between sessions
- **Max Sessions Per Day**: 1-6 configurable
- **Auto-accept Bookings**: Toggle switch

#### B. Group Sessions Settings
- **Allow Group Sessions**: Toggle to enable/disable
- **Max Participants**: 2-10 dropdown
- **Price Per Mentee**: Predefined options (250-2000 PKR)
- **Payment Gateways**: Listed (JazzCash, Easypaisa, PayFast PK) — for display only

#### C. Weekly Schedule
- **Day Toggle**: Enable/disable each day of the week
- **Add Slot**: Create time slots within enabled days
- **Slot Configuration**: Start time, end time, Solo/Group mode
- **Remove Slot**: Delete individual slots
- **Persistence**: Saved to backend via `mentorManagementApi`

#### D. Calendar Integration Section
- **Google Calendar**: Button stub (UI only, not functional)
- **Outlook Calendar**: Button stub (UI only, not functional)

#### E. Summary Stats
- **Active Days**: Count of enabled days
- **Total Time Slots**: Sum of all slots
- **Session Duration**: Display selected duration

---

### ❌ MISSING Features

#### 1. **Availability Exceptions (Blocked Dates/Vacation)**
- **Current State**: Backend API exists (`mentorManagementApi.createAvailabilityException`, `deleteAvailabilityException`) but **NOT** used in the frontend
- **Impact**: Mentors cannot mark vacation days, holidays, or specific blocked dates
- **Backend Support**: 
  - `POST /v1/mentors/me/availability/exceptions` (create)
  - `DELETE /v1/mentors/me/availability/exceptions/{id}` (delete)
  - Accepts: `date` (YYYY-MM-DD), `start_time` (optional), `end_time` (optional), `note`
- **What Needs to Be Done**:
  - Add a "Blocked Dates / Vacation" section
  - Calendar picker to select dates
  - Time range (optional) and note text
  - Load and display existing exceptions
  - Delete functionality

#### 2. **Slot Duration Configuration Per Slot**
- **Current State**: 
  - Slots use global `sessionDuration` setting
  - Individual slots don't have custom durations
  - Backend template accepts `slot_duration_minutes` but frontend hardcodes to global setting
- **Impact**: Mentors cannot offer different session lengths on different days
- **What Needs to Be Done**:
  - Allow per-slot duration configuration (optional override of global)
  - Or clarify backend design — does `slot_duration_minutes` vary per template?

#### 3. **Buffer Time Visibility in Schedule**
- **Current State**: Buffer time is configured globally but not visualized
- **Impact**: Mentors may not realize gaps between sessions
- **What Needs to Be Done**:
  - Show visual "buffer zones" in weekly schedule
  - OR add a time visualization calendar widget

#### 4. **Slot Validation**
- **Current State**: No validation that:
  - Start time < end time
  - Slots don't overlap
  - Slots respect buffer time
  - Slots don't exceed max sessions per day
- **Impact**: Invalid schedule could be saved
- **What Needs to Be Done**:
  - Add form-level validation before save
  - Show warnings for overlaps/conflicts

#### 5. **Price Per Session (Solo)**
- **Current State**: 
  - `price_per_session_solo` field exists in backend profile API
  - **NOT** shown on availability page
- **Impact**: Mentors cannot set/edit solo session pricing on this page
- **What Needs to Be Done**:
  - Add input field for solo session price (PKR)
  - Save to mentor profile via `updateMentorProfile`

#### 6. **Load Existing Profile Settings**
- **Current State**: 
  - Page loads availability templates
  - Does NOT load existing settings: timezone, session duration, buffer time, auto-accept, group settings from profile/preferences
- **Impact**: First-time load shows defaults; changes from other sources not reflected
- **What Needs to Be Done**:
  - Fetch mentor profile on mount to populate all settings
  - Load auto-accept preference if stored

#### 7. **Group Pricing Tier System**
- **Current State**: 
  - Single `group_price_per_session` field
  - Backend also supports tiered: `group_pricing: { 2: 500, 3: 800, 5: 1200, 10: 2000 }`
- **Impact**: Cannot set different prices for different group sizes
- **What Needs to Be Done**:
  - Add inputs for group pricing by participant count (2, 3, 5, 10)
  - Save as `group_pricing` object in profile update

#### 8. **Visibility Toggle**
- **Current State**: 
  - Backend has `visible` field in mentor profile (can hide from explore/listings)
  - **NOT** on availability page
- **Impact**: Cannot control discoverability from availability settings
- **What Needs to Be Done**:
  - Add toggle to show/hide mentor profile from explore page

#### 9. **Change Confirmation Dialog**
- **Current State**: 
  - Pressing save immediately submits (could lose changes)
  - No "unsaved changes" warning if user navigates away
- **Impact**: UX friction if accidental
- **What Needs to Be Done**:
  - Show confirmation before discard if `hasChanges = true`
  - Warn on navigation if unsaved

#### 10. **Availability Preview / Booking Slots View**
- **Current State**: No preview of what mentees will see (generated slots for next 7 days)
- **Impact**: Mentors can't verify their slots generate correct booking times
- **What Needs to Be Done**:
  - Show generated slots for next 7 days (like mentees see in mentor detail page)

---

### 🔄 EXTRA / Questionable Features

#### 1. **Calendar Integration Buttons (Non-functional)**
- **Current State**: Google Calendar & Outlook buttons visible but do nothing
- **Assessment**: Either stub for future feature or misleading UX
- **Recommendation**: Remove or label clearly as "Coming Soon"

#### 2. **Settings Button (No Destination)**
- **Current State**: Top-right "Settings" button exists but has no `onClick`
- **Assessment**: Dead link
- **Recommendation**: Remove or link to a settings modal

#### 3. **Auto-accept Bookings Toggle**
- **Current State**: Toggleable but unclear if:
  - It's stored anywhere
  - Backend honors it when booking is created
  - Frontend shows status before user creates booking
- **Assessment**: May not be wired end-to-end
- **Recommendation**: Verify backend integration, or add backend note

---

## 2. BOOKINGS PAGE ANALYSIS

### ✅ Implemented Features

#### A. Booking Listing & Filtering
- **Tabs**: Pending (mentor), Upcoming, Past, Cancelled
- **Auto-refresh**: 30-second polling to catch status changes
- **Status Badges**: Pending, Confirmed, Completed, Cancelled, Expired, Rescheduled

#### B. Booking Card Display
- **User Info**: Avatar, name, role (mentor/mentee)
- **Session Details**: Duration, notes, date, time
- **Status Indicator**: Color-coded badge
- **Ready to Join Badge**: For confirmed sessions

#### C. User-specific Actions
- **Mentors (Pending)**: Confirm, Reject, Message buttons
- **Mentors (Confirmed)**: Message, Mark Complete (post-session), Cancel
- **Mentees (Upcoming)**: Join Session (video), Message, Cancel
- **Mentees (Completed)**: Leave Feedback, Message

#### D. Video Session Integration
- **Join Session Button**: Routes to `/session/{bookingId}`
- **Agora Video Token**: Backend provides via `getVideoToken` API

#### E. Feedback System
- **Mentee Feedback**: Rate and comment on completed sessions
- **Dialog Component**: `FeedbackDialogNew` opens on completed bookings

#### F. Messaging Integration
- **Quick Message**: Creates/opens conversation with other party
- **Direct Link**: Via `messagingApi.createConversation`

---

### ❌ MISSING Features

#### 1. **Booking Reschedule**
- **Current State**: 
  - `rescheduled` status exists in type definition
  - No UI to reschedule a booking
  - Backend likely supports it, but frontend has no flow
- **Impact**: Users can't change session time, must cancel + rebook
- **What Needs to Be Done**:
  - Add "Reschedule" button in actions menu (for confirmed bookings)
  - Show available slots from mentor's calendar
  - POST endpoint or PATCH endpoint to reschedule

#### 2. **Booking Notes / Requirements**
- **Current State**: 
  - Notes are displayed in card if present
  - No UI to edit notes after creation
- **Impact**: Cannot refine session scope after booking
- **What Needs to Be Done**:
  - Add edit button to update notes in a confirmed booking
  - PATCH `/v1/bookings/{id}` endpoint support

#### 3. **Booking Cancellation Reason**
- **Current State**: Cancel button exists, but no reason/comment field
- **Impact**: No feedback on why mentor/mentee cancelled
- **What Needs to Be Done**:
  - Optional text field for cancellation reason
  - Store in booking notes or separate field

#### 4. **Booking Expiry Handling**
- **Current State**: 
  - `expired` status shown in badge, but:
  - No logic to auto-set expired if past datetime
  - No UI indication that a pending booking has expired
- **Impact**: Stale pending bookings may stay pending
- **What Needs to Be Done**:
  - Filter out expired bookings from lists, or
  - Auto-refresh to fetch latest status from backend
  - Mark old pending requests as expired server-side

#### 5. **Payment Status Integration**
- **Current State**: 
  - Bookings show notes (may include session topic)
  - No payment status field or receipt link
- **Impact**: Cannot see if payment was processed
- **What Needs to Be Done**:
  - Add `payment_status` field to booking response
  - Display payment receipt/link if group session required payment

#### 6. **Calendar Export / iCal**
- **Current State**: No way to export bookings to calendar
- **Impact**: Users must manually add to calendar
- **What Needs to Be Done**:
  - Add "Add to Calendar" button (generates iCal link)
  - Or "Share Calendar Link" for mentor's bookings

#### 7. **Booking Reminders / Notifications**
- **Current State**: 
  - Status changes refresh every 30s
  - No proactive reminders (email, push)
- **Impact**: Users may forget upcoming sessions
- **What Needs to Be Done**:
  - Implement reminder emails (15 min, 1 hour, 1 day before)
  - Or push notifications via browser

#### 8. **Filters & Sorting**
- **Current State**: Tabs exist, but no additional filters:
  - By mentor/mentee name
  - By date range
  - By session type / topic
- **Impact**: Hard to find specific booking in long list
- **What Needs to Be Done**:
  - Add filter panel above tab content
  - Search by name, date range, type

#### 9. **Bulk Actions**
- **Current State**: Each booking has individual actions
- **Assessment**: Low priority, but could add:
  - Cancel multiple bookings
  - Export multiple bookings
- **What Needs to Be Done**: Optional feature

#### 10. **Session Preparation Checklist**
- **Current State**: No pre-session guidelines or checklist
- **Impact**: Users unprepared for video call
- **What Needs to Be Done**:
  - Show checklist when joining session (camera test, mic test, etc.)
  - Or link to pre-session tips

---

## 3. AVAILABILITY ↔ BOOKINGS LINKAGE

### How Availability Affects Bookings

#### **Mentor Detail Page** (where mentees browse availability)
- Fetches mentor's templates via `mentorManagementApi.getAvailabilityTemplates()`
- Generates available slots for next 7-14 days
- Mentee selects a slot and opens BookingDialog
- Selected slot passed to BookingDialog as props:
  - `selectedDate`
  - `selectedTimeSlot` (formatted time)
  - `selectedSlotStartTime` (ISO datetime)
  - `selectedSlotIsGroup` (boolean)

#### **Booking Creation Flow**
1. Mentee selects slot on mentor detail page
2. BookingDialog receives slot info
3. User enters topic, goals, session type
4. Submit POST `/v1/bookings` with:
   - `mentor_id`
   - `start_at` (ISO datetime from selected slot)
   - `duration_minutes` (60, hardcoded)
   - `notes` (formatted from topic + goals)

#### **Booking Status & Mentor Actions**
- Mentor sees pending bookings on bookings page
- Can confirm/reject within availability window
- Confirmed bookings appear as "Ready to Join" for mentee
- After session, mentor marks as completed

### Current Assumptions (Verify with Backend)
- ✅ Templates are recurring (weekly schedule)
- ✅ Slots are generated server-side or client-side from templates
- ❓ Does backend auto-create slots on-demand, or client generates?
- ❓ If group session `is_group=true`, can multiple mentees book same slot?
- ❓ Buffer time enforcement: backend or frontend responsibility?

---

## 4. KEY MISSING INTEGRATIONS

### A. **Booking Auto-Accept**
- Toggle exists on availability page
- **NOT** used in backend booking creation flow
- Recommendation: 
  - Backend should check `auto_accept` when booking created
  - Auto-confirm if true, else set `pending`

### B. **Max Sessions Per Day**
- Configured on availability page
- **NOT** enforced in booking creation
- Recommendation:
  - Backend should check existing confirmed bookings on date
  - Return 409 conflict if max exceeded

### C. **Group Session Pricing**
- Configured on availability page
- Booking dialog reads `mentor.group_price_per_session`
- Initiates payment if group session with participants > 1
- **Gap**: Tiered pricing (`2: 500, 3: 800, ...`) not supported
- Recommendation:
  - Support tiered pricing in booking dialog
  - Calculate total based on participant count

### D. **Slot Duration Variability**
- Global `sessionDuration` on availability page
- Booking hardcodes 60 minutes
- **Gap**: If mentor configures 45-min slots, booking still creates 60-min session
- Recommendation:
  - Pass `duration_minutes` from selected slot to booking
  - Update booking dialog to show selected slot duration

---

## 5. ACTIONABLE CHECKLIST

### High Priority (Blocks Core Features)
- [ ] Implement **Availability Exceptions** (blocked dates)
- [ ] Load & display **existing mentor profile settings** on mount
- [ ] Add **Price Per Solo Session** input field
- [ ] Support **Group Pricing Tiers** (2, 3, 5, 10 person rates)
- [ ] Pass **slot duration** from availability to booking (not hardcode 60)
- [ ] Verify **auto-accept** backend integration
- [ ] Verify **max sessions per day** enforcement
- [ ] Implement **slot validation** (no overlaps, respects buffer time)

### Medium Priority (Improves UX)
- [ ] Add **booking reschedule** functionality
- [ ] Add **availability preview** (show generated slots for next 7 days)
- [ ] Add **payment status** to booking response & display
- [ ] Add **session reminders** (email or push)
- [ ] Add **cancellation reason** field
- [ ] Add **booking filters** (by mentor, date, type)
- [ ] Fix **Settings button** destination
- [ ] Remove or label **Calendar Integration** stubs

### Low Priority (Polish)
- [ ] Add **change confirmation** dialog for availability
- [ ] Implement **iCal export** for bookings
- [ ] Add **bulk actions** for bookings
- [ ] Add **session prep checklist** before joining

---

## 6. DEPENDENCIES TO VERIFY WITH BACKEND

1. **Availability Exception Endpoints**: Confirm `POST /v1/mentors/me/availability/exceptions` works
2. **Mentor Profile Fields**: Confirm `price_per_session_solo`, `group_pricing`, `visible` are returned and writable
3. **Booking Reschedule**: Confirm endpoint exists (likely `PATCH /v1/bookings/{id}/reschedule`)
4. **Payment Status**: Confirm booking response includes `payment_status` or related field
5. **Auto-accept Logic**: Confirm backend honors `autoAcceptBookings` setting
6. **Max Sessions**: Confirm backend enforces `maxSessionsPerDay` limit
7. **Group Slot Booking**: Confirm multiple mentees can book same group slot

---

## 7. SUMMARY TABLE

| Feature | Availability | Bookings | Linked | Status |
|---------|--------------|----------|--------|--------|
| Weekly Schedule | ✅ | — | ✅ | Complete |
| Timezone | ✅ | — | ✅ | Complete |
| Session Duration | ✅ | ❓ | ❌ | Hardcoded in booking |
| Buffer Time | ✅ | — | — | Not visualized |
| Max Sessions/Day | ✅ | — | ❌ | Not enforced |
| Auto-accept Bookings | ✅ | — | ❌ | Not integrated |
| Blocked Dates | ❌ | — | ✅ | Backend ready, UI missing |
| Group Sessions | ✅ | ✅ | ✅ | Complete |
| Group Pricing Tiers | ❌ | ✅ | ✅ | Single price only |
| Solo Price | ❌ | — | ❌ | Missing UI |
| Mentor Visibility | ❌ | — | — | Not configurable |
| Booking Reschedule | — | ❌ | ✅ | Missing |
| Cancellation Reason | — | ❌ | — | Missing |
| Payment Status | — | ❌ | ✅ | Not shown |
| Reminders | — | ❌ | — | Missing |
| Filters | — | ❌ | — | Limited (tabs only) |

