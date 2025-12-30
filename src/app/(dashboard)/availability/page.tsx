'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Loader2 } from 'lucide-react';
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

// Slot with group tier info (group tier = number of participants for pricing)
type SlotData = {
  start: string;
  end: string;
  templateId?: string;
  groupTier?: number | null; // null for solo, number for group (e.g., 2, 4, 10)
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

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
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
          setGroupPricingTiers(pricing);
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
          const dayKey = weekdayToKey[template.weekday];
          if (dayKey) {
            schedule[dayKey as keyof typeof schedule].enabled = true;
            // Normalize time format (backend may return "09:00:00", we need "09:00")
            const normalizeTime = (time: string) => time.substring(0, 5);
            schedule[dayKey as keyof typeof schedule].slots.push({
              start: normalizeTime(template.start_time),
              end: normalizeTime(template.end_time),
              templateId: template.id,
              groupTier: template.group_tier ?? null,
            });
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
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: [
            ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots,
            { start: '09:00', end: '10:00', groupTier: null },
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

          // Check if slot is in the past or overlaps with current time (only for today)
          if (dayNumber === currentDayOfWeek && startMinutes < currentTimeMinutes) {
            toast.error(`Cannot set past time slot on ${dayKey}`, {
              description: `Time slot ${slot.start} - ${slot.end} has already started or passed. Current time (PKT) is ${nowPKT.getHours().toString().padStart(2, '0')}:${nowPKT.getMinutes().toString().padStart(2, '0')}`,
            });
            hasValidationErrors = true;
          }

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
      // Save or create all slots with current start/end and group tier
      const newSlots: { day: string; start: string; end: string; groupTier: number | null }[] = [];
      const existingSlots: { day: string; start: string; end: string; templateId: string; groupTier: number | null }[] = [];

      for (const [dayKey, dayData] of Object.entries(availability.weeklySchedule)) {
        if (dayData.enabled) {
          for (const slot of dayData.slots) {
            if (!slot.templateId) {
              newSlots.push({ day: dayKey, start: slot.start, end: slot.end, groupTier: slot.groupTier ?? null });
            } else {
              existingSlots.push({ 
                day: dayKey, 
                start: slot.start, 
                end: slot.end, 
                templateId: slot.templateId, 
                groupTier: slot.groupTier ?? null 
              });
            }
          }
        }
      }

      // Create new templates
      let createdCount = 0;
      for (const slot of newSlots) {
        const result = await mentorManagementApi.createAvailabilityTemplate({
          weekday: keyToWeekday[slot.day],
          start_time: slot.start,
          end_time: slot.end,
          group_tier: slot.groupTier,
        });

        if (result.success) {
          createdCount++;
        } else {
          console.error('[Availability] Failed to create slot:', result.error);
        }
      }

      // Update existing templates
      let updatedCount = 0;
      for (const slot of existingSlots) {
        const result = await mentorManagementApi.updateAvailabilityTemplate(slot.templateId, {
          weekday: keyToWeekday[slot.day],
          start_time: slot.start,
          end_time: slot.end,
          group_tier: slot.groupTier,
        });
        if (result.success) {
          updatedCount++;
        } else {
          console.error('[Availability] Failed to update slot:', result.error);
        }
      }

      setHasChanges(false);
      toast.success(`Availability saved! Created ${createdCount}, updated ${updatedCount} slot(s).`);

      // Reload to get the new template IDs
      const reloadResult = await mentorManagementApi.getAvailabilityTemplates();
      if (reloadResult.success && reloadResult.data) {
        // Create a FRESH schedule object to avoid mutation bugs
        const schedule = createFreshSchedule();
        reloadResult.data.forEach((template) => {
          const dayKey = weekdayToKey[template.weekday];
          if (dayKey) {
            schedule[dayKey as keyof typeof schedule].enabled = true;
            // Normalize time format (backend may return "09:00:00", we need "09:00")
            const normalizeTime = (time: string) => time.substring(0, 5);
            schedule[dayKey as keyof typeof schedule].slots.push({
              start: normalizeTime(template.start_time),
              end: normalizeTime(template.end_time),
              templateId: template.id,
              groupTier: template.group_tier ?? null,
            });
          }
        });
        setAvailability(prev => ({ ...prev, weeklySchedule: schedule }));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Availability</h1>
          <p className="text-gray-600 mt-1">
            Manage your mentoring schedule and availability
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-brand hover:bg-brand/90"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Weekly Schedule */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Set your recurring weekly availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const daySchedule = availability.weeklySchedule[day.key as keyof typeof availability.weeklySchedule];

            return (
              <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={(checked) => handleDayToggle(day.key, checked)}
                    />
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        {day.label}
                      </Label>
                      <p className="text-xs text-gray-500">{getNextWeekdayDate(day.key)}</p>
                    </div>
                    {daySchedule.enabled && daySchedule.slots.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {daySchedule.slots.length} slot{daySchedule.slots.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  {daySchedule.enabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTimeSlot(day.key)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Slot
                    </Button>
                  )}
                </div>

                {daySchedule.enabled && (
                  <div className="space-y-2">
                    {daySchedule.slots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No time slots set. Click &quot;Add Slot&quot; to add availability.
                      </p>
                    ) : (
                      daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Select
                            value={slot.start}
                            onValueChange={(value) => updateTimeSlot(day.key, index, 'start', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-gray-500">to</span>
                          <Select
                            value={slot.end}
                            onValueChange={(value) => updateTimeSlot(day.key, index, 'end', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Session Type: Solo or Group */}
                          <Select
                            value={slot.groupTier === null ? 'solo' : 'group'}
                            onValueChange={(value) => {
                              if (value === 'solo') {
                                updateSlotGroupTier(day.key, index, null);
                              } else {
                                // When switching to group, set to first available tier
                                const validTiers = Object.entries(groupPricingTiers)
                                  .filter(([_, price]) => Number(price) > 0)
                                  .map(([tier, _]) => Number(tier))
                                  .sort((a, b) => a - b);
                                if (validTiers.length > 0) {
                                  updateSlotGroupTier(day.key, index, validTiers[0]);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                          {/* Solo Price Display - Only show if Solo is selected */}
                          {slot.groupTier === null && soloPrice !== null && (
                            <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md w-44">
                              <span className="text-sm font-medium text-blue-900">
                                PKR {soloPrice}/session
                              </span>
                            </div>
                          )}
                          {/* Group Tier Selection - Only show if Group is selected */}
                          {slot.groupTier !== null && (
                            <Select
                              value={slot.groupTier?.toString() ?? ''}
                              onValueChange={(value) => {
                                updateSlotGroupTier(day.key, index, Number(value));
                              }}
                            >
                              <SelectTrigger className="w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTimeSlot(day.key, index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
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

      {/* Quick Stats */}
      <Card className="rounded-2xl shadow-sm bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Availability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {Object.values(availability.weeklySchedule).filter(day => day.enabled).length}
              </p>
              <p className="text-blue-700">Active days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {Object.values(availability.weeklySchedule)
                  .reduce((total, day) => total + day.slots.length, 0)}
              </p>
              <p className="text-blue-700">Total time slots</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
