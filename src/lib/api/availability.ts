import type { AvailabilitySchedule, AvailabilitySlot, WeeklyScheduleDay } from '../types';

const STORAGE_KEY = 'mc_availability_v1';

type AvailabilityStore = Record<string, AvailabilitySchedule>; // userId -> schedule

function readStore(): AvailabilityStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AvailabilityStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: AvailabilityStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getDefaultSchedule(): AvailabilitySchedule {
  const defaultDay = (enabled = true): WeeklyScheduleDay => ({
    enabled,
    slots: enabled ? [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }] : [],
  });
  return {
    timezone: 'Asia/Karachi',
    weeklySchedule: {
      monday: defaultDay(true),
      tuesday: defaultDay(true),
      wednesday: defaultDay(true),
      thursday: defaultDay(true),
      friday: defaultDay(true),
      saturday: defaultDay(false),
      sunday: defaultDay(false),
    },
    blockedDates: [],
    sessionDuration: 60,
    bufferTime: 15,
    maxSessionsPerDay: 4,
    autoAcceptBookings: true,
  };
}

// Utilities
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const dayNamesShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function formatAmPm(hour: number, minute: number): string {
  const h = ((hour + 11) % 12) + 1;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${m} ${ampm}`;
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const availability = {
  getSchedule(userId: string): AvailabilitySchedule {
    const store = readStore();
    return store[userId] ?? getDefaultSchedule();
  },

  saveSchedule(userId: string, schedule: AvailabilitySchedule): void {
    const store = readStore();
    store[userId] = schedule;
    writeStore(store);
  },

  // Generate upcoming availability slots from schedule
  getGeneratedSlots(userId: string, days = 7): AvailabilitySlot[] {
    const schedule = this.getSchedule(userId);
    const results: AvailabilitySlot[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      // skip blocked dates
      if (schedule.blockedDates.includes(isoDate)) continue;

      const dow = d.getDay(); // 0=Sun
      const dayKey = dayKeys[dow];
      const dayName = dayNamesShort[dow];
      const day = schedule.weeklySchedule[dayKey];
      if (!day || !day.enabled) continue;

      // Build slots: step by sessionDuration with buffer in each range
      const slots: string[] = [];
      for (const range of day.slots) {
        const startMin = parseTimeToMinutes(range.start);
        const endMin = parseTimeToMinutes(range.end);
        const step = schedule.sessionDuration + schedule.bufferTime;
        for (let t = startMin; t + schedule.sessionDuration <= endMin; t += step) {
          const hr = Math.floor(t / 60);
          const min = t % 60;
          slots.push(formatAmPm(hr, min));
        }
      }

      if (slots.length) {
        results.push({ date: isoDate, dayName, slots });
      }
    }

    return results;
  },
};

export type { AvailabilitySchedule, AvailabilitySlot };

