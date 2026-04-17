import { v4 as uuid } from 'uuid';
import { store } from '../store/DataStore';
import { ResourceRequest, Allocation } from '../types';
import { allocateResource } from './allocation';
import { createNotification } from '../services/notification';

export function handleEmergencyOverride(emergencyRequest: ResourceRequest): {
  success: boolean;
  overriddenAllocation?: Allocation;
  message: string;
} {
  const resources = store.getResourcesByCategory(emergencyRequest.resourceType);
  const available = resources.filter(r => r.status === 'active' && r.availableCount > 0);

  // If available, just allocate normally
  if (available.length > 0) {
    const result = allocateResource(emergencyRequest);
    return {
      success: result.status === 'allocated',
      message: result.message,
    };
  }

  // No available resources — must override
  const activeAllocations = store.getActiveAllocations()
    .filter(a => {
      const resource = store.getResourceById(a.resourceId);
      return resource && resource.category === emergencyRequest.resourceType && !a.isEmergency;
    });

  if (activeAllocations.length === 0) {
    // All current allocations are emergencies, add to emergency queue
    store.updateRequest(emergencyRequest.id, {
      status: 'queued',
      effectivePriority: 999,
      queuePosition: 0,
    });

    // Notify admins
    const admins = store.getUsers().filter(u => u.role === 'admin');
    admins.forEach(admin => {
      createNotification({
        userId: admin.id,
        type: 'emergency_override',
        title: '🚨 Manual Override Needed',
        message: `Emergency request ${emergencyRequest.id} - all current allocations are emergencies. Manual intervention required.`,
        priority: 'urgent',
      });
    });

    return {
      success: false,
      message: 'All allocations are emergencies. Added to priority queue. Admin notified.',
    };
  }

  // Sort by priority ascending (lowest priority first = best candidate to override)
  // We need to find the request for each allocation to get the priority
  const withPriority = activeAllocations.map(a => {
    const req = store.getRequestById(a.requestId);
    return { allocation: a, priority: req?.effectivePriority || 0 };
  }).sort((a, b) => a.priority - b.priority);

  const toOverride = withPriority[0].allocation;

  // Deallocate the overridden resource
  store.updateAllocation(toOverride.id, { status: 'overridden' });

  const resource = store.getResourceById(toOverride.resourceId);
  if (resource) {
    store.updateResource(resource.id, {
      availableCount: resource.availableCount + 1,
      occupiedCount: Math.max(0, resource.occupiedCount - 1),
    });
  }

  // Move overridden user to top of priority queue
  const overriddenRequest = store.getRequestById(toOverride.requestId);
  if (overriddenRequest) {
    store.updateRequest(overriddenRequest.id, {
      status: 'queued',
      queuePosition: 1,
      effectivePriority: 500, // High priority for overridden user
    });
  }

  // Allocate to emergency
  const result = allocateResource(emergencyRequest);

  // Notify overridden user
  createNotification({
    userId: toOverride.userId,
    type: 'emergency_override',
    title: '🚨 URGENT: Resource Reallocated',
    message: `Your ${toOverride.resourceName} has been reallocated to a life-threatening emergency. You've been moved to Priority Position #1 in the queue.`,
    priority: 'urgent',
  });

  // Notify emergency user
  createNotification({
    userId: emergencyRequest.userId,
    type: 'allocation_success',
    title: '🚨 Emergency Resource Allocated',
    message: `Emergency resource allocated immediately: ${toOverride.resourceName}`,
    priority: 'urgent',
  });

  // Log activity
  store.addActivity({
    id: uuid(),
    type: 'emergency_override',
    title: 'Emergency Override',
    description: `${toOverride.resourceName} overridden for emergency patient ${emergencyRequest.details.patientName || emergencyRequest.userName}`,
    resourceId: toOverride.resourceId,
    userId: emergencyRequest.userId,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    overriddenAllocation: toOverride,
    message: `Emergency override successful. ${toOverride.resourceName} reallocated.`,
  };
}
