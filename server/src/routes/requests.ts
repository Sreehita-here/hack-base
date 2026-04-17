import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { store } from '../store/DataStore';
import { ResourceRequest } from '../types';
import { calculatePriority } from '../engine/priority';
import { allocateResource } from '../engine/allocation';
import { handleEmergencyOverride } from '../engine/emergency';
import { createNotification } from '../services/notification';

const router = Router();

// POST /api/requests — Submit a new resource request
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { resourceType, severity, isEmergency, details } = req.body;

    if (!resourceType || !severity) {
      res.status(400).json({ error: 'resourceType and severity are required' });
      return;
    }

    const user = store.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const settings = store.getSettings();
    const weights = settings.priorityWeights as Record<string, number>;
    const request: ResourceRequest = {
      id: uuid(),
      userId: user.id,
      userName: user.name,
      resourceType,
      severity,
      basePriority: weights[severity] || 20,
      effectivePriority: 0,
      status: 'pending',
      timestamp: new Date().toISOString(),
      queuePosition: 0,
      priorityBoosts: 0,
      isEmergency: isEmergency || false,
      boostNotified: false,
      details: details || {},
    };

    // Calculate initial priority
    request.effectivePriority = calculatePriority(request);

    store.addRequest(request);

    // Log activity
    store.addActivity({
      id: uuid(),
      type: isEmergency ? 'emergency_override' : 'request_queued',
      title: isEmergency ? '🚨 Emergency Request' : 'New Request',
      description: `${user.name} requested ${resourceType} (${severity})`,
      resourceId: undefined,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    // Handle emergency
    if (isEmergency) {
      const emergencyResult = handleEmergencyOverride(request);
      res.json({
        request: store.getRequestById(request.id),
        allocation: emergencyResult,
      });
      return;
    }

    // Normal allocation
    const result = allocateResource(request);

    if (result.status === 'allocated') {
      createNotification({
        userId: user.id,
        type: 'allocation_success',
        title: 'Resource Allocated!',
        message: `Your ${resourceType} is ready! ${result.message}`,
        priority: 'high',
        actionUrl: '/dashboard',
        actionLabel: 'View Details',
      });

      store.addActivity({
        id: uuid(),
        type: 'allocation',
        title: 'Resource Allocated',
        description: `${resourceType} allocated to ${user.name}`,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      createNotification({
        userId: user.id,
        type: 'no_availability',
        title: 'Added to Queue',
        message: `No ${resourceType} available. Added to queue at position #${result.queuePosition}. Estimated wait: ${result.estimatedWait} min`,
        priority: 'medium',
        actionUrl: '/queue',
        actionLabel: 'View Queue',
      });
    }

    res.json({
      request: store.getRequestById(request.id),
      allocation: result,
    });
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/requests — All requests (admin) or user's requests
router.get('/', authMiddleware, (req: Request, res: Response) => {
  if (req.user!.role === 'admin') {
    const status = req.query.status as string;
    if (status) {
      res.json(store.getRequestsByStatus(status));
    } else {
      res.json(store.getRequests());
    }
  } else {
    res.json(store.getRequestsByUser(req.user!.userId));
  }
});

// GET /api/requests/queue/:resourceType
router.get('/queue/:resourceType', authMiddleware, (req: Request, res: Response) => {
  const queue = store.getQueueByResourceType(req.params.resourceType);
  const entries = queue.map((r, idx) => ({
    requestId: r.id,
    userId: r.userId,
    userName: r.userName,
    resourceType: r.resourceType,
    basePriority: r.basePriority,
    currentPriority: r.effectivePriority,
    timestamp: r.timestamp,
    waitingTime: Math.floor((Date.now() - new Date(r.timestamp).getTime()) / 60000),
    position: idx + 1,
    estimatedWait: (idx + 1) * 30,
    severity: r.severity,
    isEmergency: r.isEmergency,
    priorityBoosts: {
      waitTime: r.priorityBoosts,
      vulnerability: r.details.age !== undefined && (r.details.age < 5 || r.details.age > 65) ? 15 : 0,
      fairness: 0,
    },
  }));
  res.json(entries);
});

// GET /api/requests/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const request = store.getRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  res.json(request);
});

// PUT /api/requests/:id/cancel
router.put('/:id/cancel', authMiddleware, (req: Request, res: Response) => {
  const request = store.getRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  if (request.userId !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  store.updateRequest(req.params.id, { status: 'cancelled' });

  store.addActivity({
    id: uuid(),
    type: 'request_cancelled',
    title: 'Request Cancelled',
    description: `${request.userName} cancelled ${request.resourceType} request`,
    userId: request.userId,
    timestamp: new Date().toISOString(),
  });

  res.json({ message: 'Request cancelled' });
});

// POST /api/requests/:id/approve (Admin)
router.post('/:id/approve', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const request = store.getRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const result = allocateResource(request);
  res.json({ request: store.getRequestById(request.id), allocation: result });
});

export default router;
