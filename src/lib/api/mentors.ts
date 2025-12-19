import type { AvailabilitySlot } from '../types';
import { mentorsApi } from './mentors-api';

// Note: This wrapper is deprecated. Use mentorsApi directly for real API calls.
// Keeping this for backward compatibility with existing code that uses mentors.getById() etc.

export const mentors = {
  // These methods are deprecated - use mentorsApi instead
  getAll: () => {
    console.warn('[mentors] getAll() is deprecated. Use mentorsApi.searchMentors() instead.');
    return [];
  },
  getById: (id: string) => {
    console.warn('[mentors] getById() is deprecated. Use mentorsApi.getMentorById() instead.');
    return null;
  },
  getSimilar: (id: string, limit = 3) => {
    console.warn('[mentors] getSimilar() is deprecated. Similar mentors should come from the API.');
    return [];
  },
  async getAvailableSlots(mentorId: string, days = 7): Promise<AvailabilitySlot[]> {
    // Use real API for availability
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + days);

    const result = await mentorsApi.getMentorAvailability(
      mentorId,
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    );

    if (result.success && result.data) {
      // Convert backend slots to frontend format
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const slotsByDate = new Map<string, { display: string; iso: string }[]>();

      result.data.slots.forEach(slot => {
        const startDate = new Date(slot.start_at);
        const dateKey = startDate.toISOString().split('T')[0];
        const timeStr = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        if (!slotsByDate.has(dateKey)) {
          slotsByDate.set(dateKey, []);
        }
        slotsByDate.get(dateKey)!.push({ display: timeStr, iso: slot.start_at });
      });

      const slots: AvailabilitySlot[] = [];
      slotsByDate.forEach((slotsData, date) => {
        const dateObj = new Date(date + 'T00:00:00Z');
        const sorted = slotsData.sort((a, b) => a.iso.localeCompare(b.iso));
        slots.push({
          date,
          dayName: dayNames[dateObj.getUTCDay()],
          slots: sorted.map(s => s.display),
          slotTimes: sorted.map(s => s.iso),
        });
      });

      return slots.sort((a, b) => a.date.localeCompare(b.date));
    }

    return [];
  },
  applyFeedback(mentorId: string, rating: number): void {
    console.warn('[mentors] applyFeedback() is deprecated. Feedback is handled by the backend.');
    // No-op - feedback is now handled by backend
  },
};
