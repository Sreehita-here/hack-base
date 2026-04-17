import { store } from '../store/DataStore';
import { Booking, Conflict, ConflictResult } from '../types';

export function detectConflicts(booking: {
  resourceId: string;
  userId: string;
  date: string;
  startHour: number;
  endHour: number;
  participants?: number;
  equipment?: string[];
}): ConflictResult {
  const conflicts: Conflict[] = [];

  // Check 1: Double Booking — same resource, same time
  const existingBookings = store.getBookingsByDate(booking.resourceId, booking.date);
  existingBookings.forEach(existing => {
    if (timeSlotsOverlap(existing.startHour, existing.endHour, booking.startHour, booking.endHour)) {
      conflicts.push({
        type: 'double_booking',
        severity: 'error',
        message: `This slot is already booked (${existing.timeSlot}) by ${existing.userName}`,
        conflictingBooking: existing,
      });
    }
  });

  // Check 2: User's overlapping bookings (any resource, same time)
  const userBookings = store.getBookingsByUser(booking.userId)
    .filter(b => b.date === booking.date && b.status === 'confirmed');
  userBookings.forEach(existing => {
    if (existing.resourceId !== booking.resourceId &&
        timeSlotsOverlap(existing.startHour, existing.endHour, booking.startHour, booking.endHour)) {
      conflicts.push({
        type: 'user_overlap',
        severity: 'error',
        message: `You already have a booking at ${existing.timeSlot} (${existing.resourceName})`,
        suggestion: 'Cancel existing booking or choose a different time',
      });
    }
  });

  // Check 3: Capacity
  const resource = store.getResourceById(booking.resourceId);
  if (resource && booking.participants && resource.maxCapacity) {
    if (booking.participants > resource.maxCapacity) {
      conflicts.push({
        type: 'capacity_exceeded',
        severity: 'error',
        message: `Max capacity is ${resource.maxCapacity} but you requested ${booking.participants} participants`,
        suggestion: `Reduce participants or choose a larger lab`,
      });
    }
  }

  // Check 4: Resource maintenance
  if (resource && resource.status === 'maintenance') {
    conflicts.push({
      type: 'maintenance_window',
      severity: 'error',
      message: 'This resource is currently under maintenance',
      suggestion: 'Check back later or choose an alternative resource',
    });
  }

  // Check 5: Max concurrent bookings per user
  const settings = store.getSettings();
  const activeUserBookings = store.getBookingsByUser(booking.userId)
    .filter(b => b.status === 'confirmed' && new Date(b.date) >= new Date());
  if (activeUserBookings.length >= settings.system.maxConcurrentBookingsPerUser) {
    conflicts.push({
      type: 'capacity_exceeded',
      severity: 'warning',
      message: `You already have ${activeUserBookings.length} active bookings (max: ${settings.system.maxConcurrentBookingsPerUser})`,
      suggestion: 'Cancel an existing booking first',
    });
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    canProceed: !conflicts.some(c => c.severity === 'error'),
  };
}

function timeSlotsOverlap(
  start1: number, end1: number,
  start2: number, end2: number
): boolean {
  return start1 < end2 && start2 < end1;
}

export function findAlternativeSlots(
  resourceId: string,
  date: string,
  duration: number
): { timeSlot: string; startHour: number; endHour: number }[] {
  const alternatives: { timeSlot: string; startHour: number; endHour: number }[] = [];
  const bookings = store.getBookingsByDate(resourceId, date);
  const bookedHours = new Set<number>();

  bookings.forEach(b => {
    for (let h = b.startHour; h < b.endHour; h++) {
      bookedHours.add(h);
    }
  });

  // Check each possible start hour (9 AM - 6 PM)
  for (let start = 9; start <= 18 - duration; start++) {
    let available = true;
    for (let h = start; h < start + duration; h++) {
      if (bookedHours.has(h)) { available = false; break; }
    }
    if (available) {
      alternatives.push({
        timeSlot: `${start}:00 - ${start + duration}:00`,
        startHour: start,
        endHour: start + duration,
      });
    }
  }

  return alternatives.slice(0, 5);
}
