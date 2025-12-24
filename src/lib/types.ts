// Shared types for Mentor Connect KU

// User type (previously from mock-auth, now defined here)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'mentor' | 'mentee';
  avatar?: string;
  bio?: string;
  expertise?: string[];
  company?: string;
  title?: string;
  location?: string;
}

export type Role = 'mentor' | 'mentee' | 'admin';

// Bookings
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingFeedback {
  rating: number; // 1-5
  comment?: string;
  givenByUserId: string;
  createdAt: string; // ISO
}

export interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  datetime: string; // ISO start time
  durationMin: number;
  sessionType: string;
  topic: string;
  goals?: string;
  status: BookingStatus;
  videoCallLink?: string;
  createdAt: string;
  updatedAt: string;
  feedback?: BookingFeedback;
}

// Messaging
export type MessageType = 'text' | 'system';

export interface Conversation {
  id: string;
  mentorId: string;
  menteeId: string;
  bookingId?: string;
  createdAt: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  type: MessageType;
  createdAt: string;
}

// Events
export type EventFormat = 'Virtual' | 'In-Person' | 'Hybrid';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date (YYYY-MM-DD)
  timeRange: string; // e.g., "10:00 AM - 11:00 AM"
  type: string; // e.g., Workshop, Panel
  format: EventFormat;
  hostUserId: string; // mentor or org user id
  attendees: string[]; // user ids
  maxAttendees?: number;
  tags: string[];
  isFree: boolean;
  createdAt: string;
}

// Availability
export interface TimeSlotRange {
  start: string; // HH:mm
  end: string;   // HH:mm
  isGroup?: boolean; // optional flag when stored in UI state
}

export interface WeeklyScheduleDay {
  enabled: boolean;
  slots: TimeSlotRange[];
}

export interface AvailabilitySchedule {
  timezone: string;
  weeklySchedule: {
    monday: WeeklyScheduleDay;
    tuesday: WeeklyScheduleDay;
    wednesday: WeeklyScheduleDay;
    thursday: WeeklyScheduleDay;
    friday: WeeklyScheduleDay;
    saturday: WeeklyScheduleDay;
    sunday: WeeklyScheduleDay;
  };
  blockedDates: string[]; // ISO dates (YYYY-MM-DD)
  sessionDuration: number; // minutes
  bufferTime: number; // minutes
  maxSessionsPerDay: number;
  autoAcceptBookings: boolean;
}

export interface AvailabilitySlot {
  date: string;       // YYYY-MM-DD
  dayName: string;    // MON/TUE/...
  slots: string[];    // "9:00 AM" display text
  slotTimes: string[]; // Original ISO timestamps for booking
  // Optional flags aligned with slots/slotTimes
  slotGroupFlags?: boolean[];
}

// ============================================
// Backend API Types (from OpenAPI spec)
// ============================================

// Auth Request/Response Types
export type UserRole = 'mentor' | 'mentee' | 'admin';

export interface SignupRequest {
  email: string;
  role: UserRole;
  full_name: string;
  password: string;
  confirm_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

// User Types from Backend
export interface BackendUser {
  id: string;           // UUID
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface BackendProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  timezone: string;
  languages: string[];
  created_at: string;
  updated_at?: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  timezone?: string;
  languages?: string[];
}

// Mentor Types from Backend
export interface MentorProfile {
  user_id: string;
  headline?: string;
  experience_years: number;
  skills: string[];
  price_per_session_solo?: number;
  price_per_session_group?: number;
  visible: boolean;
  rating_avg: number;
  rating_count: number;
  // Group session settings (optional, backend may ignore if unsupported)
  group_enabled?: boolean;
  group_max_participants?: number; // max mentees in a combined session
  group_price_per_session?: number; // PKR per mentee per session
}

export interface MentorStats {
  total_sessions: number;
  active_mentees: number;
  rating_avg: number;
  response_time_hours: number;
}

export interface MentorDetailResponse {
  user: BackendUser;
  profile: BackendProfile;
  mentor_profile: MentorProfile;
  stats: MentorStats;
}

export interface BackendAvailabilitySlot {
  start_at: string;  // ISO datetime
  end_at: string;
  // Whether this slot supports group sessions (optional)
  is_group?: boolean;
}

export interface MentorAvailabilityResponse {
  from_date: string;
  to_date: string;
  slots: BackendAvailabilitySlot[];
}

export interface FeedbackCreateRequest {
  rating: number;      // 1-5
  comment?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

// ============================================
// Payments (Pakistan gateways)
// ============================================

export type PaymentGateway = 'jazzcash' | 'easypaisa' | 'payfast_pk';

export interface PaymentLinkRequest {
  booking_id: string;
  amount_pkr: number;
  description: string;
  gateway: PaymentGateway;
  return_url: string; // where gateway redirects after payment
  cancel_url: string; // optional cancel/failed redirection
  metadata?: Record<string, string | number | boolean>;
}

export interface PaymentLinkResponse {
  payment_id: string;
  payment_url: string; // hosted checkout URL
  expires_at?: string; // ISO datetime
}

export interface PaymentStatusResponse {
  payment_id: string;
  status: 'initiated' | 'paid' | 'failed' | 'expired';
  booking_id: string;
  amount_pkr: number;
  gateway: PaymentGateway;
  paid_at?: string;
}
