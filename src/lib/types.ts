// Shared types for Mentor Connect KU (frontend mock services)

import type { User } from './mock-auth';

export type Role = 'mentor' | 'mentee';

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
  slots: string[];    // "9:00 AM" etc.
}

// Re-export User for convenience
export type { User };

