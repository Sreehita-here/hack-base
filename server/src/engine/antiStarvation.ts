import { store } from '../store/DataStore';
import { calculatePriority, getBoostTier } from './priority';
import { createNotification } from '../services/notification';

export function updateAllPriorities(): { boostedUsers: string[] } {
  const queuedRequests = store.getRequests().filter(r => r.status === 'queued');
  const boostedUsers: string[] = [];

  queuedRequests.forEach(request => {
    const oldPriority = request.effectivePriority;
    const newPriority = calculatePriority(request);

    if (newPriority !== oldPriority) {
      const boost = newPriority - request.basePriority;
      const oldBoost = request.priorityBoosts;

      store.updateRequest(request.id, {
        effectivePriority: newPriority,
        priorityBoosts: boost,
      });

      // Check if boost tier changed
      const oldTier = getBoostTier(oldBoost);
      const newTier = getBoostTier(boost);

      if (newTier.tier > oldTier.tier && !request.boostNotified) {
        // Notify user about priority boost
        createNotification({
          userId: request.userId,
          type: 'priority_boost',
          title: '⬆️ Your Priority Has Been Boosted!',
          message: `Your priority increased from ${oldPriority} to ${newPriority} (+${boost} points). ${newTier.label}`,
          priority: 'medium',
        });
        store.updateRequest(request.id, { boostNotified: true });
        boostedUsers.push(request.userId);
      }
    }
  });

  // Re-sort and update queue positions per resource type
  const resourceTypes = [...new Set(queuedRequests.map(r => r.resourceType))];
  resourceTypes.forEach(type => {
    const queue = store.getQueueByResourceType(type);
    queue.forEach((req, idx) => {
      store.updateRequest(req.id, { queuePosition: idx + 1 });
    });
  });

  // Check for admin alerts (users waiting > threshold)
  const settings = store.getSettings();
  queuedRequests.forEach(request => {
    const waitingMinutes = (Date.now() - new Date(request.timestamp).getTime()) / 60000;
    if (waitingMinutes > settings.antiStarvation.adminAlertThreshold) {
      // Alert admins
      const admins = store.getUsers().filter(u => u.role === 'admin');
      admins.forEach(admin => {
        createNotification({
          userId: admin.id,
          type: 'system',
          title: '🚨 Long Wait Alert',
          message: `User ${request.userName} has been waiting ${Math.floor(waitingMinutes)} minutes for ${request.resourceType}`,
          priority: 'urgent',
        });
      });
    }
  });

  return { boostedUsers };
}
