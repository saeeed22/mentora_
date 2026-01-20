'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Loader2, Calendar, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, CurrentUser } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { mentorManagementApi, AvailabilityTemplate } from '@/lib/api/mentor-management-api';
import { mentorsApi } from '@/lib/api/mentors-api';
import { toast } from 'sonner';

// Slot with group tier info (group tier = 1 for solo, number > 1 for group)
type SlotData = {
  start: string;
  end: string;
  templateId?: string;
  groupTier: number | null; // 1 for solo, 2, 3, 5, 10 for group (participants count)
  isRecurring?: boolean; // true for weekly recurring, false for date-specific
  specificDate?: string; // YYYY-MM-DD format for date-specific slots
};

// Default availability data structure
const defaultAvailability = {
  weeklySchedule: {
    monday: { enabled: false, slots: [] as SlotData[] },
    tuesday: { enabled: false, slots: [] as SlotData[] },
    wednesday: { enabled: false, slots: [] as SlotData[] },
    thursday: { enabled: false, slots: [] as SlotData[] },
    friday: { enabled: false, slots: [] as SlotData[] },
    saturday: { enabled: false, slots: [] as SlotData[] },
    sunday: { enabled: false, slots: [] as SlotData[] },
  },
};

// Helper to create fresh schedule (avoids array reference mutation bugs)
const createFreshSchedule = () => ({
  monday: { enabled: false, slots: [] as SlotData[] },
  tuesday: { enabled: false, slots: [] as SlotData[] },
  wednesday: { enabled: false, slots: [] as SlotData[] },
  thursday: { enabled: false, slots: [] as SlotData[] },
  friday: { enabled: false, slots: [] as SlotData[] },
  saturday: { enabled: false, slots: [] as SlotData[] },
  sunday: { enabled: false, slots: [] as SlotData[] },
});

// Helper to map weekday number to day key
const weekdayToKey: Record<number, string> = {
  0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday',
  4: 'friday', 5: 'saturday', 6: 'sunday',
};
const keyToWeekday: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

const timeSlots = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4).toString().padStart(2, '0');
  const minutes = ((i % 4) * 15).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

// Helper to get next occurrence of weekday
const getNextWeekdayDate = (dayKey: string): string => {
  const today = new Date();
  const targetDay = keyToWeekday[dayKey];
  const currentDay = (today.getDay() + 6) % 7; // Convert to Monday=0 format

  let daysUntil = (targetDay - currentDay + 7) % 7;
  if (daysUntil === 0) daysUntil = 0; // If today, show today's date

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntil);

  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function AvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Available group pricing tiers from mentor profile (e.g., { 2: 500, 4: 800, 10: 1500 })
  const [groupPricingTiers, setGroupPricingTiers] = useState<Record<number, number>>({});
  // Solo session price from mentor profile
  const [soloPrice, setSoloPrice] = useState<number | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role !== 'mentor') {
      router.push('/home');
      return;
    }
    setUser(currentUser);

    // Load templates and mentor profile from backend
    const loadTemplates = async () => {
      setIsLoading(true);

      // Fetch mentor profile to get group pricing tiers and solo price
      if (currentUser?.id) {
        const profileResult = await mentorsApi.getMentorById(currentUser.id);
        if (profileResult.success && profileResult.data) {
          const pricing = profileResult.data.mentor_profile?.group_pricing || {};
          const solo = profileResult.data.mentor_profile?.price_per_session_solo || null;
          // Filter out undefined values to match Record<number, number> type
          const cleanPricing: Record<number, number> = {};
          Object.entries(pricing).forEach(([key, value]) => {
            if (value !== undefined) {
              cleanPricing[Number(key)] = value;
            }
          });
          setGroupPricingTiers(cleanPricing);
          setSoloPrice(solo);
          console.log('[Availability] Loaded solo price:', solo);
          console.log('[Availability] Loaded group pricing tiers:', pricing);
          console.log('[Availability] Group pricing type:', typeof pricing);
          console.log('[Availability] Group pricing entries:', Object.entries(pricing));

          // Log valid tiers
          const validTiers = Object.entries(pricing)
            .filter(([_, price]) => {
              const numPrice = Number(price);
              console.log(`[Availability] Tier price check: ${price} (${typeof price}) -> ${numPrice} -> valid: ${numPrice > 0}`);
              return numPrice > 0;
            });
          console.log('[Availability] Valid group tiers (price > 0):', validTiers);
        }
      }

      // Fetch availability templates
      const result = await mentorManagementApi.getAvailabilityTemplates();

      if (result.success && result.data) {
        console.log('[Availability] Loaded templates:', result.data);
        // Create a FRESH schedule object to avoid mutation bugs
        const schedule = createFreshSchedule();

        result.data.forEach((template: AvailabilityTemplate) => {
          // For recurring templates, use weekday. For date-specific, use the day from specific_date
          let dayKey: string | null = null;

          if (template.weekday !== null && template.weekday !== undefined) {
            // Recurring slot - use weekday directly
            dayKey = weekdayToKey[template.weekday];
          } else if (template.specific_date) {
            // Date-specific slot - extract weekday from the date using UTC to avoid timezone shifts
            const parts = template.specific_date.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const date = parseInt(parts[2]);
            const dateObj = new Date(Date.UTC(year, month, date));
            const weekday = dateObj.getUTCDay(); // 0=Sunday, 1=Monday, etc.
            const dayMap: Record<number, string> = {
              0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
              4: 'thursday', 5: 'friday', 6: 'saturday',
            };
            dayKey = dayMap[weekday];
          }

          console.log('[Availability] Processing template:', {
            id: template.id,
            weekday: template.weekday ?? 'undefined',
            specific_date: template.specific_date ?? 'undefined',
            dayKey,
            group_tier: template.group_tier,
            type: typeof template.group_tier,
          });
          if (dayKey) {
            schedule[dayKey as keyof typeof schedule].enabled = true;
            // Normalize time format (backend may return "09:00:00", we need "09:00")
            const normalizeTime = (time: string) => time.substring(0, 5);
            const slotData = {
              start: normalizeTime(template.start_time),
              end: normalizeTime(template.end_time),
              templateId: template.id,
              groupTier: template.group_tier ?? null,
              isRecurring: template.is_recurring ?? true,
              specificDate: template.specific_date ?? undefined,
            };
            console.log('[Availability] Adding slot to schedule:', slotData);
            schedule[dayKey as keyof typeof schedule].slots.push(slotData);
          }
        });

        setAvailability(prev => ({ ...prev, weeklySchedule: schedule }));
      }
      setIsLoading(false);
    };

    loadTemplates();
  }, [router]);

  const handleDayToggle = (day: string, enabled: boolean) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          enabled,
        },
      },
    }));
    setHasChanges(true);
  };

  const addTimeSlot = (day: string) => {
    // Calculate next occurrence of this weekday for default specific_date
    const today = new Date();
    const targetDay = keyToWeekday[day];
    const currentDay = (today.getDay() + 6) % 7;
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7; // Next occurrence, not today
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    const specificDate = targetDate.toISOString().split('T')[0];

    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: [
            ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots,
            { start: '09:00', end: '10:00', groupTier: 1, isRecurring: false, specificDate },
          ],
        },
      },
    }));
    setHasChanges(true);
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
    setHasChanges(true);
  };

  const updateSlotGroupTier = (day: string, index: number, groupTier: number | null) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.map((slot, i) =>
            i === index ? { ...slot, groupTier } : slot
          ),
        },
      },
    }));
    setHasChanges(true);
  };

  const updateSlotRecurringMode = (day: string, index: number, isRecurring: boolean) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.map((slot, i) => {
            if (i === index) {
              if (isRecurring) {
                // Remove specific_date when switching to recurring
                const { specificDate, ...rest } = slot;
                return { ...rest, isRecurring: true };
              } else {
                // Add default specific_date when switching to date-specific
                const today = new Date();
                const targetDay = keyToWeekday[day];
                const currentDay = (today.getDay() + 6) % 7;
                let daysUntil = (targetDay - currentDay + 7) % 7;
                if (daysUntil === 0) daysUntil = 7;
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + daysUntil);
                const specificDate = targetDate.toISOString().split('T')[0];
                return { ...slot, isRecurring: false, specificDate };
              }
            }
            return slot;
          }),
        },
      },
    }));
    setHasChanges(true);
  };

  const updateSlotSpecificDate = (day: string, index: number, specificDate: string) => {
    // Validate that the selected date matches the weekday
    // Parse date string to extract year, month, day to avoid timezone shifts
    const parts = specificDate.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
    const date = parseInt(parts[2]);

    // Create date in UTC to get correct weekday
    const selectedDate = new Date(Date.UTC(year, month, date));
    const selectedWeekday = selectedDate.getUTCDay(); // 0=Sunday, 1=Monday, etc.

    // Map getDay() result to our day keys (0=Sunday, 1=Monday, ...)
    const dayMap: Record<number, string> = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
      4: 'thursday', 5: 'friday', 6: 'saturday',
    };
    const selectedDayKey = dayMap[selectedWeekday];

    if (selectedDayKey !== day) {
      const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
      toast.error(`Please select a date that falls on ${dayCapitalized}`);
      return;
    }

    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.map((slot, i) =>
            i === index ? { ...slot, specificDate } : slot
          ),
        },
      },
    }));
    setHasChanges(true);
  };

  const removeTimeSlot = async (day: string, index: number) => {
    const slot = availability.weeklySchedule[day as keyof typeof availability.weeklySchedule].slots[index];

    // If slot has a templateId, delete from backend
    if (slot.templateId) {
      const result = await mentorManagementApi.deleteAvailabilityTemplate(slot.templateId);
      if (!result.success) {
        toast.error('Failed to remove time slot');
        return;
      }
    }

    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.filter((_, i) => i !== index),
        },
      },
    }));
    toast.success('Time slot removed');
  };

  const handleSave = async () => {
    if (!user) return;

    // Get current day and time in Pakistan timezone (Asia/Karachi)
    const nowPKT = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    const currentDayOfWeek = (nowPKT.getDay() + 6) % 7; // Convert to Monday=0 format
    const currentTimeMinutes = nowPKT.getHours() * 60 + nowPKT.getMinutes();

    // Validate all slots before saving
    let hasValidationErrors = false;
    for (const [dayKey, dayData] of Object.entries(availability.weeklySchedule)) {
      if (dayData.enabled) {
        const dayNumber = keyToWeekday[dayKey];

        for (let i = 0; i < dayData.slots.length; i++) {
          const slot = dayData.slots[i];
          const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
          const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);

          // Check if start time < end time
          if (startMinutes >= endMinutes) {
            toast.error(`Invalid time slot on ${dayKey}`, {
              description: `Start time (${slot.start}) must be before end time (${slot.end})`,
            });
            hasValidationErrors = true;
          }

          // Check slot duration (max 1 hour = 60 minutes)
          const durationMinutes = endMinutes - startMinutes;
          if (durationMinutes > 60) {
            toast.error(`Time slot too long on ${dayKey}`, {
              description: `Slot ${slot.start} - ${slot.end} is ${durationMinutes} minutes. Maximum allowed is 60 minutes (1 hour)`,
            });
            hasValidationErrors = true;
          }

          // Check if slot is in the past (only for NEW date-specific slots)
          // Relaxed validation: skip if slot already exists (has templateId)
          if (slot.isRecurring === false && slot.specificDate && !slot.templateId) {
            // For date-specific slots, check if the date is in the past
            const parts = slot.specificDate.split('-');
            const slotYear = parseInt(parts[0]);
            const slotMonth = parseInt(parts[1]) - 1;
            const slotDay = parseInt(parts[2]);
            const slotDate = new Date(slotYear, slotMonth, slotDay);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            slotDate.setHours(0, 0, 0, 0);

            if (slotDate < today) {
              toast.error(`Cannot set past time slot on ${dayKey}`, {
                description: `Date ${slot.specificDate} is in the past. Please select a future date.`,
              });
              hasValidationErrors = true;
            } else if (slotDate.getTime() === today.getTime() && startMinutes < currentTimeMinutes) {
              // If it's today, also check the time
              toast.error(`Cannot set past time slot on ${dayKey}`, {
                description: `Time slot ${slot.start} - ${slot.end} has already started or passed. Current time (PKT) is ${nowPKT.getHours().toString().padStart(2, '0')}:${nowPKT.getMinutes().toString().padStart(2, '0')}`,
              });
              hasValidationErrors = true;
            }
          }
          // Note: For recurring slots (isRecurring !== false), we don't validate past time
          // because they repeat every week and are future-proof

          // Check for duplicate slots of the same type (solo or group)
          for (let j = i + 1; j < dayData.slots.length; j++) {
            const otherSlot = dayData.slots[j];
            const otherStartMinutes = parseInt(otherSlot.start.split(':')[0]) * 60 + parseInt(otherSlot.start.split(':')[1]);
            const otherEndMinutes = parseInt(otherSlot.end.split(':')[0]) * 60 + parseInt(otherSlot.end.split(':')[1]);

            // Check if slots overlap
            const slotsOverlap = (
              (startMinutes >= otherStartMinutes && startMinutes < otherEndMinutes) ||
              (endMinutes > otherStartMinutes && endMinutes <= otherEndMinutes) ||
              (startMinutes <= otherStartMinutes && endMinutes >= otherEndMinutes)
            );

            if (slotsOverlap) {
              // Check if both are same type (both solo or both group with same tier)
              const bothSolo = slot.groupTier === null && otherSlot.groupTier === null;
              const bothSameTierGroup = slot.groupTier !== null && otherSlot.groupTier !== null && slot.groupTier === otherSlot.groupTier;

              if (bothSolo) {
                toast.error(`Duplicate solo slot on ${dayKey}`, {
                  description: `Cannot have multiple solo slots at ${slot.start} - ${slot.end}. Remove one or change to group.`,
                });
                hasValidationErrors = true;
              } else if (bothSameTierGroup) {
                toast.error(`Duplicate group slot on ${dayKey}`, {
                  description: `Cannot have multiple group (${slot.groupTier} people) slots at ${slot.start} - ${slot.end}. Remove one or change tier.`,
                });
                hasValidationErrors = true;
              }
              // If one is solo and one is group, that's allowed (they'll compete for booking)
              // If both are group but different tiers, that's also allowed
            }
          }
        }
      }
    }

    if (hasValidationErrors) return;

    setIsSaving(true);

    try {
      const newSlots: Array<SlotData & { day: string }> = [];
      const existingSlots: Array<SlotData & { day: string }> = [];
      const slotsToDelete: Array<string> = [];

      for (const [dayKey, dayData] of Object.entries(availability.weeklySchedule)) {
        if (dayData.enabled) {
          for (const slot of dayData.slots) {
            const slotWithDay = { ...slot, day: dayKey };
            if (!slot.templateId) {
              newSlots.push(slotWithDay);
            } else {
              existingSlots.push(slotWithDay);
            }
          }
        } else {
          // If day is disabled, any existing templates on this day should be deleted
          for (const slot of dayData.slots) {
            if (slot.templateId) {
              slotsToDelete.push(slot.templateId);
            }
          }
        }
      }

      // Delete templates for disabled days
      let deletedCount = 0;
      for (const templateId of slotsToDelete) {
        console.log('[Availability] Deleting template (day disabled):', templateId);
        const result = await mentorManagementApi.deleteAvailabilityTemplate(templateId);
        if (result.success) {
          deletedCount++;
        }
      }

      // Create new templates
      let createdCount = 0;
      for (const slot of newSlots) {
        // Validate date-specific slots match their weekday
        if (slot.isRecurring === false && slot.specificDate) {
          const parts = slot.specificDate.split('-');
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const date = parseInt(parts[2]);
          const selectedDate = new Date(Date.UTC(year, month, date));
          const selectedWeekday = selectedDate.getUTCDay();
          const dayMap: Record<number, string> = {
            0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
            4: 'thursday', 5: 'friday', 6: 'saturday',
          };
          const selectedDayKey = dayMap[selectedWeekday];
          if (selectedDayKey !== slot.day) {
            toast.error(`Slot in ${slot.day} section has invalid date ${slot.specificDate}. Please fix before saving.`);
            setIsSaving(false);
            return;
          }
        }

        // Calculate slot duration in minutes
        const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
        const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
        const durationMinutes = endMinutes - startMinutes;

        const templateData: any = {
          start_time: slot.start,
          end_time: slot.end,
          slot_duration_minutes: durationMinutes,
          group_tier: slot.groupTier,
        };

        // Add weekday or specific_date based on isRecurring
        if (slot.isRecurring !== false) {
          // Recurring (default)
          templateData.weekday = keyToWeekday[slot.day];
          templateData.is_recurring = true;
        } else {
          // Date-specific
          templateData.specific_date = slot.specificDate;
          templateData.is_recurring = false;
        }

        console.log('[Availability] Creating template:', templateData);
        const result = await mentorManagementApi.createAvailabilityTemplate(templateData);

        if (result.success) {
          console.log('[Availability] ✓ Created template successfully:', result.data);
          createdCount++;
        } else {
          console.error('[Availability] ✗ Failed to create slot:', result.error);
          toast.error(`Failed to create slot: ${result.error}`);
        }
      }

      // Update existing templates
      let updatedCount = 0;
      for (const slot of existingSlots) {
        // Validate date-specific slots match their weekday
        if (slot.isRecurring === false && slot.specificDate) {
          const parts = slot.specificDate.split('-');
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const date = parseInt(parts[2]);
          const selectedDate = new Date(Date.UTC(year, month, date));
          const selectedWeekday = selectedDate.getUTCDay();
          const dayMap: Record<number, string> = {
            0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
            4: 'thursday', 5: 'friday', 6: 'saturday',
          };
          const selectedDayKey = dayMap[selectedWeekday];
          if (selectedDayKey !== slot.day) {
            toast.error(`Slot in ${slot.day} section has invalid date ${slot.specificDate}. Please fix before saving.`);
            setIsSaving(false);
            return;
          }
        }

        // Calculate slot duration in minutes
        const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
        const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
        const durationMinutes = endMinutes - startMinutes;

        const templateData: any = {
          start_time: slot.start,
          end_time: slot.end,
          slot_duration_minutes: durationMinutes,
          group_tier: slot.groupTier,
        };

        // Add weekday or specific_date based on isRecurring
        if (slot.isRecurring !== false) {
          templateData.weekday = keyToWeekday[slot.day];
          templateData.is_recurring = true;
        } else {
          templateData.specific_date = slot.specificDate;
          templateData.is_recurring = false;
        }

        console.log('[Availability] Updating template:', slot.templateId, templateData);
        const result = await mentorManagementApi.updateAvailabilityTemplate(slot.templateId!, templateData);

        if (result.success) {
          console.log('[Availability] ✓ Updated template successfully:', result.data);
          updatedCount++;
        } else {
          console.error('[Availability] ✗ Failed to update slot:', result.error);
          toast.error(`Failed to update slot: ${result.error}`);
        }
      }

      setHasChanges(false);
      let successMessage = `✓ Availability saved! Created ${createdCount}, updated ${updatedCount} slot(s).`;
      if (deletedCount > 0) {
        successMessage += ` Removed ${deletedCount} slot(s) from disabled days.`;
      }
      toast.success(successMessage);
      console.log('[Availability] Save complete. Created:', createdCount, 'Updated:', updatedCount, 'Deleted:', deletedCount);

      // Reload to get the new template IDs
      console.log('[Availability] Reloading templates after save...');
      const reloadResult = await mentorManagementApi.getAvailabilityTemplates();
      console.log('[Availability] Reload result:', reloadResult);
      if (reloadResult.success && reloadResult.data) {
        console.log('[Availability] ✓ Reloaded templates successfully:', reloadResult.data.length, 'templates');
        console.log('[Availability] Template details:', reloadResult.data);
        // Create a FRESH schedule object to avoid mutation bugs
        const schedule = createFreshSchedule();
        let loadedCount = 0;
        reloadResult.data.forEach((template) => {
          let dayKey: string | null = null;

          if (template.weekday !== null && template.weekday !== undefined) {
            // Recurring slot - use weekday directly
            dayKey = weekdayToKey[template.weekday];
          } else if (template.specific_date) {
            // Date-specific slot - extract weekday from the date using UTC to avoid timezone shifts
            const parts = template.specific_date.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const date = parseInt(parts[2]);
            const dateObj = new Date(Date.UTC(year, month, date));
            const weekday = dateObj.getUTCDay(); // 0=Sunday, 1=Monday, etc.
            const dayMap: Record<number, string> = {
              0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
              4: 'thursday', 5: 'friday', 6: 'saturday',
            };
            dayKey = dayMap[weekday];
          }

          console.log('[Availability] Processing template:', template.id, 'weekday:', template.weekday, 'specific_date:', template.specific_date, 'dayKey:', dayKey);
          if (dayKey) {
            schedule[dayKey as keyof typeof schedule].enabled = true;
            // Normalize time format (backend may return "09:00:00", we need "09:00")
            const normalizeTime = (time: string) => time.substring(0, 5);
            schedule[dayKey as keyof typeof schedule].slots.push({
              start: normalizeTime(template.start_time),
              end: normalizeTime(template.end_time),
              templateId: template.id,
              groupTier: template.group_tier ?? null,
              isRecurring: template.is_recurring ?? true,
              specificDate: template.specific_date ?? undefined,
            });
            loadedCount++;
            console.log('[Availability] ✓ Loaded slot:', dayKey, normalizeTime(template.start_time), '-', normalizeTime(template.end_time), 'isRecurring:', template.is_recurring, 'specificDate:', template.specific_date);
          } else {
            console.warn('[Availability] ⚠ Could not determine dayKey for template:', template.id);
          }
        });
        console.log('[Availability] Successfully loaded', loadedCount, 'out of', reloadResult.data.length, 'templates');

        if (loadedCount === 0 && reloadResult.data.length > 0) {
          toast.error('⚠️ Backend issue: Templates saved but weekday/specific_date fields are missing. Check backend response.');
          console.error('[Availability] ⚠️ BACKEND ISSUE: All templates have null weekday AND specific_date. Backend needs to return these fields.');
        }

        setAvailability(prev => ({ ...prev, weeklySchedule: schedule }));
        console.log('[Availability] Updated availability state with schedule');
      } else {
        console.error('[Availability] ✗ Failed to reload templates:', reloadResult);
        toast.error('Failed to reload availability templates');
      }
    } catch (error) {
      console.error('[Availability] Save error:', error);
      toast.error('Failed to save availability');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'mentor') {
    return null;
  }

  // Always show all days so mentor can add slots to any day
  const daysToShow = daysOfWeek;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Availability</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your mentoring schedule and availability
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`bg-brand hover:bg-brand/90 w-auto sm:w-auto order-1 sm:order-2 fixed bottom-20 right-4 z-40 lg:static lg:z-auto shadow-lg lg:shadow-none px-6 rounded-lg transition-all h-12 lg:h-9 ${(!hasChanges && !isSaving) ? 'scale-0 opacity-0 pointer-events-none lg:scale-100 lg:opacity-100 lg:pointer-events-auto' : 'scale-100 opacity-100'}`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Weekly Schedule */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Set your recurring weekly availability or one-time date-specific slots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-hidden">
          {daysToShow.map((day) => {
            const daySchedule = availability.weeklySchedule[day.key as keyof typeof availability.weeklySchedule];

            return (
              <div key={day.key} className="border border-gray-200 rounded-lg p-3 sm:p-4 overflow-hidden">
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={daySchedule.enabled}
                        onCheckedChange={(checked) => handleDayToggle(day.key, checked)}
                        className="data-[state=checked]:bg-brand"
                      />
                      <Label className="text-base font-bold text-gray-900">
                        {day.label}
                      </Label>
                    </div>
                    {daySchedule.enabled && daySchedule.slots.length > 0 && (
                      <Badge variant="secondary" className="bg-brand/5 text-brand border-brand/10 font-semibold px-2 py-0.5">
                        {daySchedule.slots.length} {daySchedule.slots.length > 1 ? 'slots' : 'slot'}
                      </Badge>
                    )}
                  </div>

                  {daySchedule.enabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTimeSlot(day.key)}
                      className="w-full sm:w-auto border-brand/20 text-brand hover:bg-brand/5 hover:text-brand-dark transition-all shadow-sm h-10 sm:h-9"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Available Slot
                    </Button>
                  )}
                </div>

                {daySchedule.enabled && (
                  <div className="space-y-4 overflow-hidden">
                    {daySchedule.slots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No time slots set. Click &quot;Add Slot&quot; to add availability.
                      </p>
                    ) : (
                      daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 lg:p-3 bg-white lg:bg-gray-50/30 rounded-2xl border border-gray-100 lg:border-transparent lg:hover:border-gray-200 transition-all relative group shadow-sm lg:shadow-none overflow-hidden">
                          {/* Delete Button - Always visible */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTimeSlot(day.key, index)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 z-10 transition-colors"
                            title="Remove slot"
                          >
                            <Plus className="w-5 h-5 rotate-45" />
                          </Button>

                          {/* Time Range Section */}
                          <div className="w-full lg:w-auto min-w-0">
                            <Label className="text-[10px] text-gray-400 uppercase font-bold mb-2 block lg:hidden tracking-wider">Time Range</Label>
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 sm:gap-3 items-center max-w-full">
                              <Select
                                value={slot.start}
                                onValueChange={(value) => updateTimeSlot(day.key, index, 'start', value)}
                              >
                                <SelectTrigger className="w-full min-w-0 bg-gray-50/50 border-gray-200 h-11 sm:h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)]" collisionPadding={10}>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <span className="text-gray-300 text-xs font-medium shrink-0">to</span>

                              <Select
                                value={slot.end}
                                onValueChange={(value) => updateTimeSlot(day.key, index, 'end', value)}
                              >
                                <SelectTrigger className="w-full min-w-0 bg-gray-50/50 border-gray-200 h-11 sm:h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)]" collisionPadding={10}>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Frequency Section */}
                          <div className="w-full lg:w-32 min-w-0">
                            <Label className="text-[10px] text-gray-400 uppercase font-bold mb-2 block lg:hidden tracking-wider">Frequency</Label>
                            <Select
                              value={slot.isRecurring !== false ? 'recurring' : 'specific'}
                              onValueChange={(value) => {
                                updateSlotRecurringMode(day.key, index, value === 'recurring');
                              }}
                            >
                              <SelectTrigger className="w-full bg-white lg:bg-gray-50/50 border-gray-200 h-11 sm:h-9 min-w-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="w-[var(--radix-select-trigger-width)]" collisionPadding={10}>
                                <SelectItem value="recurring">Recurring</SelectItem>
                                <SelectItem value="specific">One-Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Date Picker Section */}
                          {slot.isRecurring === false && (
                            <div className="w-full lg:w-auto lg:flex-1 lg:max-w-[180px] min-w-0 max-w-full">
                              <Label className="text-[10px] text-gray-400 uppercase font-bold mb-2 block lg:hidden tracking-wider">Select Date</Label>
                              <input
                                type="date"
                                key={`${day.key}-${index}-date`}
                                value={slot.specificDate || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateSlotSpecificDate(day.key, index, value);
                                }}
                                className="w-full px-2 py-3 sm:py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all h-11 sm:h-9 [&::-webkit-date-and-time-value]:text-left [&::-webkit-calendar-picker-indicator]:opacity-70"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          )}
                          {/* Session Type Section */}
                          <div className="w-full lg:w-24 min-w-0">
                            <Label className="text-[10px] text-gray-400 uppercase font-bold mb-2 block lg:hidden tracking-wider">Session Type</Label>
                            <Select
                              value={slot.groupTier === 1 || slot.groupTier === null ? 'solo' : 'group'}
                              onValueChange={(value) => {
                                if (value === 'solo') {
                                  updateSlotGroupTier(day.key, index, 1);
                                } else {
                                  const validTiers = Object.entries(groupPricingTiers)
                                    .filter(([tier, price]) => Number(tier) > 1 && Number(price) > 0)
                                    .map(([tier, _]) => Number(tier))
                                    .sort((a, b) => a - b);
                                  if (validTiers.length > 0) {
                                    updateSlotGroupTier(day.key, index, validTiers[0]);
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="w-full bg-white lg:bg-gray-50/50 border-gray-200 h-11 sm:h-9 min-w-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="w-[var(--radix-select-trigger-width)]" collisionPadding={10}>
                                <SelectItem value="solo">Solo</SelectItem>
                                <SelectItem
                                  value="group"
                                  disabled={(() => {
                                    const validTiers = Object.entries(groupPricingTiers)
                                      .filter(([_, price]) => Number(price) > 0);
                                    return validTiers.length === 0;
                                  })()}
                                >
                                  Group
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Pricing Section */}
                          <div className="w-full lg:w-auto lg:flex-1 lg:max-w-[200px] min-w-0">
                            <div className="lg:hidden mb-2">
                              <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                {slot.groupTier !== null && slot.groupTier > 1 ? 'Group Pricing' : 'Base Price'}
                              </Label>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto min-w-0">
                              {/* Solo Price Display */}
                              {(slot.groupTier === 1 || slot.groupTier === null) && soloPrice !== null && (
                                <div className="flex items-center px-3 py-3 sm:py-2 bg-brand/5 border border-brand/10 rounded-lg w-full h-11 sm:h-9 min-w-0">
                                  <span className="text-xs font-bold text-brand truncate">
                                    PKR {soloPrice}/session
                                  </span>
                                </div>
                              )}

                              {/* Group Tier Selection */}
                              {slot.groupTier !== null && slot.groupTier > 1 && (
                                <Select
                                  value={slot.groupTier?.toString() ?? ''}
                                  onValueChange={(value) => {
                                    updateSlotGroupTier(day.key, index, Number(value));
                                  }}
                                >
                                  <SelectTrigger className="w-full bg-brand/5 border-brand/10 text-brand font-bold h-11 sm:h-9 min-w-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="w-[var(--radix-select-trigger-width)]" collisionPadding={10}>
                                    {Object.entries(groupPricingTiers)
                                      .filter(([_, price]) => Number(price) > 0)
                                      .map(([tier, price]) => Number(tier))
                                      .sort((a, b) => a - b)
                                      .map((tier) => {
                                        const price = groupPricingTiers[tier];
                                        return (
                                          <SelectItem key={tier} value={tier.toString()}>
                                            {tier} people - PKR {price}
                                          </SelectItem>
                                        );
                                      })}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Availability Summary */}
      <Card className="rounded-2xl shadow-sm bg-white border-gray-100 overflow-hidden">
        <div className="bg-brand/5 px-6 py-4 border-b border-brand/10">
          <CardTitle className="text-brand flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5" />
            Availability Summary
          </CardTitle>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Days Stat */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100/50">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  {Object.values(availability.weeklySchedule).filter(day => day.enabled).length}
                </p>
                <p className="text-sm font-medium text-gray-500">Active Days</p>
              </div>
            </div>

            {/* Total Slots Stat */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100/50">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  {Object.values(availability.weeklySchedule)
                    .reduce((total, day) => total + day.slots.length, 0)}
                </p>
                <p className="text-sm font-medium text-gray-500">Total Slots</p>
              </div>
            </div>

            {/* Recurring vs One-Time Breakdown */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100/50 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-sm font-medium text-gray-500">Type Breakdown</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] bg-white border-gray-200 text-gray-600 px-2 py-0">
                    {Object.values(availability.weeklySchedule)
                      .flatMap(day => day.slots)
                      .filter(s => s.isRecurring !== false).length} Recurring
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-white border-gray-200 text-gray-600 px-2 py-0">
                    {Object.values(availability.weeklySchedule)
                      .flatMap(day => day.slots)
                      .filter(s => s.isRecurring === false).length} One-time
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
