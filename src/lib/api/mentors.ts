import { mockMentorProfiles, getMentorById, getSimilarMentors } from '../mock-mentors';
import type { AvailabilitySlot } from '../types';

export const mentors = {
  getAll: () => mockMentorProfiles,
  getById: (id: string) => getMentorById(id),
  getSimilar: (id: string, limit = 3) => getSimilarMentors(id, limit),
  async getAvailableSlots(mentorId: string, days = 7): Promise<AvailabilitySlot[]> {
    // Try availability service generated slots first; fall back to static mentor profile slots
    try {
      const availability = await import('./availability');
      const slots = availability.availability.getGeneratedSlots(mentorId, days);
      if (slots && slots.length) return slots;
    } catch {
      // ignore, fall back below
    }
    const mentor = getMentorById(mentorId);
    const slots = mentor?.availability_slots ?? [];
    // Add slotTimes if missing (mock data compatibility)
    return slots.map(s => ({
      ...s,
      slotTimes: 'slotTimes' in s ? s.slotTimes as string[] : s.slots.map(() => new Date().toISOString()),
    }));
  },
  applyFeedback(mentorId: string, rating: number): void {
    const idx = mockMentorProfiles.findIndex(m => m.id === mentorId);
    if (idx === -1) return;
    const m = mockMentorProfiles[idx];
    const currentCount = m.reviewCount || 0;
    const currentRating = m.rating || 0;
    const newCount = currentCount + 1;
    const newRating = Math.round(((currentRating * currentCount + rating) / newCount) * 10) / 10;
    mockMentorProfiles[idx] = { ...m, reviewCount: newCount, rating: newRating };
  },
};

