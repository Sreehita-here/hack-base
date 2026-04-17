import { ResourceRequest, SystemSettings } from '../types';
import { store } from '../store/DataStore';

export function calculatePriority(request: ResourceRequest, settings?: SystemSettings): number {
  const s = settings || store.getSettings();

  // Base priority from severity
  let basePriority = s.priorityWeights[request.severity] || 20;

  // Age factor (healthcare) — vulnerable populations
  if (request.details.age !== undefined) {
    if (request.details.age < 5 || request.details.age > 65) {
      basePriority += 15;
    }
  }

  // Emergency override
  if (request.isEmergency) {
    return 999;
  }

  // Waiting time boost (anti-starvation)
  const waitingMs = Date.now() - new Date(request.timestamp).getTime();
  const waitingMinutes = waitingMs / 60000;
  const waitBoost = calculateAgeBoost(waitingMinutes, basePriority, s);

  // Fair queuing — penalty for users with recent allocations
  const recentAllocations = store.getRecentAllocationsCount(request.userId);
  const fairnessPenalty = recentAllocations * 2;

  const finalPriority = basePriority + waitBoost - fairnessPenalty;
  return Math.max(0, Math.floor(finalPriority));
}

export function calculateAgeBoost(
  waitingMinutes: number,
  basePriority: number,
  settings?: SystemSettings
): number {
  const s = settings || store.getSettings();
  const { boostStartThreshold, boostRate, maxBoostMultiplier } = s.antiStarvation;

  if (waitingMinutes < boostStartThreshold) {
    return 0;
  }

  const effectiveWaitTime = waitingMinutes - boostStartThreshold;
  const rawBoost = effectiveWaitTime * boostRate;
  const maxBoost = basePriority * maxBoostMultiplier;
  return Math.min(rawBoost, maxBoost);
}

export function getBoostTier(boost: number): { tier: number; label: string; color: string } {
  if (boost >= 51) return { tier: 3, label: '🚀 Large Boost', color: 'gold' };
  if (boost >= 21) return { tier: 2, label: '⬆️⬆️ Medium Boost', color: 'orange' };
  if (boost > 0) return { tier: 1, label: '⬆️ Small Boost', color: 'blue' };
  return { tier: 0, label: '', color: '' };
}
