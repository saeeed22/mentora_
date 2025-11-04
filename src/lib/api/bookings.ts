import type { Booking, BookingStatus, Role } from '../types';

const STORAGE_KEY = 'mc_bookings_v1';

function readStore(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

function writeStore(bookings: Booking[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function roomUrl(bookingId: string): string {
  return `https://meet.jit.si/mentora-${bookingId}`;
}

export const bookings = {
  listAll(): Booking[] {
    return readStore();
  },

  listForUser(userId: string, role: Role): Booking[] {
    const all = readStore();
    return role === 'mentor'
      ? all.filter(b => b.mentorId === userId)
      : all.filter(b => b.menteeId === userId);
  },

  getById(id: string): Booking | undefined {
    return readStore().find(b => b.id === id);
  },

  create(input: {
    mentorId: string;
    menteeId: string;
    datetime: string; // ISO
    durationMin?: number;
    sessionType: string;
    topic: string;
    goals?: string;
    status?: BookingStatus; // defaults to confirmed in mock
  }): Booking {
    const all = readStore();
    const id = genId('bk');
    const createdAt = nowIso();
    const booking: Booking = {
      id,
      mentorId: input.mentorId,
      menteeId: input.menteeId,
      datetime: input.datetime,
      durationMin: input.durationMin ?? 60,
      sessionType: input.sessionType,
      topic: input.topic,
      goals: input.goals,
      status: input.status ?? 'confirmed',
      videoCallLink: roomUrl(id),
      createdAt,
      updatedAt: createdAt,
    };
    all.push(booking);
    writeStore(all);
    return booking;
  },

  updateStatus(id: string, status: BookingStatus): Booking | undefined {
    const all = readStore();
    const idx = all.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], status, updatedAt: nowIso() };
    writeStore(all);
    return all[idx];
  },

  cancel(id: string): Booking | undefined {
    return this.updateStatus(id, 'cancelled');
  },

  addFeedback(id: string, feedback: { rating: number; comment?: string; givenByUserId: string }): Booking | undefined {
    const all = readStore();
    const idx = all.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    all[idx] = {
      ...all[idx],
      feedback: { ...feedback, createdAt: nowIso() },
      updatedAt: nowIso(),
    };
    writeStore(all);
    return all[idx];
  },
};

export type { Booking };

