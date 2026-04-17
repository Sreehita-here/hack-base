import { v4 as uuid } from 'uuid';
import { store } from '../store/DataStore';
import { ResourceRequest, AllocationResult, Allocation, ResourceCategory } from '../types';
import { calculatePriority } from './priority';

export function allocateResource(request: ResourceRequest): AllocationResult {
  // Find available resources of the requested type
  const resources = store.getResourcesByCategory(request.resourceType);
  const available = resources.filter(r => r.status === 'active' && r.availableCount > 0);

  if (available.length > 0) {
    // Find best match (closest location, most availability)
    const bestResource = available.sort((a, b) => b.availableCount - a.availableCount)[0];

    // Create allocation
    const duration = request.details.duration || 4;
    const allocation: Allocation = {
      id: uuid(),
      resourceId: bestResource.id,
      resourceName: bestResource.name,
      userId: request.userId,
      userName: request.userName,
      requestId: request.id,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
      duration,
      status: 'active',
      isEmergency: request.isEmergency,
    };

    store.addAllocation(allocation);

    // Update resource counts
    store.updateResource(bestResource.id, {
      availableCount: bestResource.availableCount - 1,
      occupiedCount: bestResource.occupiedCount + 1,
    });

    // Update request status
    store.updateRequest(request.id, { status: 'allocated' });

    return {
      status: 'allocated',
      resource: store.getResourceById(bestResource.id),
      message: `Resource allocated successfully: ${bestResource.name}`,
      estimatedDuration: duration,
    };
  }

  // No resources available — add to queue
  const queue = store.getQueueByResourceType(request.resourceType);
  const priority = calculatePriority(request);
  const position = queue.filter(q => q.effectivePriority > priority).length + 1;

  store.updateRequest(request.id, {
    status: 'queued',
    effectivePriority: priority,
    queuePosition: position,
  });

  // Estimate wait time (avg 2 hours per allocation)
  const estimatedWait = position * 30; // rough estimate: 30 min per position

  return {
    status: 'queued',
    queuePosition: position,
    estimatedWait,
    message: `Added to queue at position ${position}`,
    totalInQueue: queue.length + 1,
  };
}

export function releaseResource(allocationId: string): void {
  const allocation = store.getAllocations().find(a => a.id === allocationId);
  if (!allocation) return;

  // Mark allocation as completed
  store.updateAllocation(allocationId, { status: 'completed' });

  // Update resource counts
  const resource = store.getResourceById(allocation.resourceId);
  if (resource) {
    store.updateResource(resource.id, {
      availableCount: resource.availableCount + 1,
      occupiedCount: Math.max(0, resource.occupiedCount - 1),
    });

    // Check queue for next request
    reassignFromQueue(resource.category as ResourceCategory);
  }
}

export function reassignFromQueue(resourceType: ResourceCategory): ResourceRequest | null {
  const queue = store.getQueueByResourceType(resourceType);
  if (queue.length === 0) return null;

  // Recalculate priorities
  queue.forEach(req => {
    const newPriority = calculatePriority(req);
    store.updateRequest(req.id, { effectivePriority: newPriority });
  });

  // Re-fetch sorted queue
  const updatedQueue = store.getQueueByResourceType(resourceType);
  if (updatedQueue.length === 0) return null;

  const nextRequest = updatedQueue[0];

  // Try to allocate
  const result = allocateResource(nextRequest);
  if (result.status === 'allocated') {
    // Update remaining queue positions
    const remaining = store.getQueueByResourceType(resourceType);
    remaining.forEach((req, idx) => {
      store.updateRequest(req.id, { queuePosition: idx + 1 });
    });
    return nextRequest;
  }

  return null;
}
