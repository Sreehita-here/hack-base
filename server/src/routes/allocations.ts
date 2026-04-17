import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { store } from '../store/DataStore';
import { releaseResource } from '../engine/allocation';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/allocations
router.get('/', authMiddleware, (_req: Request, res: Response) => {
  res.json(store.getAllocations());
});

// GET /api/allocations/active
router.get('/active', authMiddleware, (_req: Request, res: Response) => {
  res.json(store.getActiveAllocations());
});

// GET /api/allocations/user/:userId
router.get('/user/:userId', authMiddleware, (req: Request, res: Response) => {
  res.json(store.getAllocationsByUser(req.params.userId));
});

// POST /api/allocations/:id/extend
router.post('/:id/extend', authMiddleware, (req: Request, res: Response) => {
  const allocation = store.getAllocations().find(a => a.id === req.params.id);
  if (!allocation) {
    res.status(404).json({ error: 'Allocation not found' });
    return;
  }

  const additionalHours = req.body.hours || 2;
  const newEndTime = new Date(new Date(allocation.endTime).getTime() + additionalHours * 60 * 60 * 1000);

  store.updateAllocation(req.params.id, {
    endTime: newEndTime.toISOString(),
    duration: allocation.duration + additionalHours,
  });

  res.json({ message: 'Allocation extended', newEndTime: newEndTime.toISOString() });
});

// POST /api/allocations/:id/release
router.post('/:id/release', authMiddleware, (req: Request, res: Response) => {
  const allocation = store.getAllocations().find(a => a.id === req.params.id);
  if (!allocation) {
    res.status(404).json({ error: 'Allocation not found' });
    return;
  }

  releaseResource(req.params.id);

  store.addActivity({
    id: uuid(),
    type: 'resource_released',
    title: 'Resource Released',
    description: `${allocation.resourceName} released by ${allocation.userName}`,
    resourceId: allocation.resourceId,
    userId: allocation.userId,
    timestamp: new Date().toISOString(),
  });

  res.json({ message: 'Resource released' });
});

export default router;
