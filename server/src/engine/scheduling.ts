import { store } from '../store/DataStore';

interface TimeSlotSuggestion {
  timeSlot: string;
  startHour: number;
  endHour: number;
  score: number;
  demandLevel: 'low' | 'medium' | 'high';
  waitProbability: string;
}

// Simulated historical demand data (in a real system this comes from analytics)
const DEMAND_BY_HOUR: Record<number, number> = {
  9: 60, 10: 85, 11: 95, 12: 40, 13: 70,
  14: 90, 15: 80, 16: 65, 17: 45,
};

const DEMAND_BY_DAY: Record<number, number> = {
  0: 20, // Sunday
  1: 85, // Monday
  2: 65, // Tuesday
  3: 75, // Wednesday
  4: 95, // Thursday
  5: 80, // Friday
  6: 35, // Saturday
};

export function suggestBestTimeSlots(
  resourceId: string,
  date: string,
  duration: number
): TimeSlotSuggestion[] {
  const bookings = store.getBookingsByDate(resourceId, date);
  const bookedHours = new Set<number>();

  bookings.forEach(b => {
    for (let h = b.startHour; h < b.endHour; h++) {
      bookedHours.add(h);
    }
  });

  const slots: TimeSlotSuggestion[] = [];
  const maxDemand = Math.max(...Object.values(DEMAND_BY_HOUR));

  for (let start = 9; start <= 18 - duration; start++) {
    let available = true;
    let totalDemand = 0;

    for (let h = start; h < start + duration; h++) {
      if (bookedHours.has(h)) { available = false; break; }
      totalDemand += DEMAND_BY_HOUR[h] || 50;
    }

    if (!available) continue;

    const avgDemand = totalDemand / duration;
    const score = Math.round(100 - (avgDemand / maxDemand * 100));

    slots.push({
      timeSlot: `${start}:00 - ${start + duration}:00`,
      startHour: start,
      endHour: start + duration,
      score,
      demandLevel: score > 70 ? 'low' : score > 40 ? 'medium' : 'high',
      waitProbability: score > 70 ? 'No wait expected' : score > 40 ? 'Short wait possible' : 'Likely wait',
    });
  }

  return slots.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function getDemandAnalytics() {
  return {
    byHour: DEMAND_BY_HOUR,
    byDay: DEMAND_BY_DAY,
    peakHours: [10, 11, 14],
    offPeakHours: [9, 12, 17],
    recommendations: [
      'Thursday 2-4 PM typically has high demand. Book early!',
      'Weekend slots usually available. Consider booking Saturday.',
      'Lunch hour (12-1 PM) is generally less busy.',
    ],
  };
}
