import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { store } from '../store/DataStore';
import { Resource } from '../types';

const router = Router();

// GET /api/resources
router.get('/', authMiddleware, (_req: Request, res: Response) => {
  const resources = store.getResources();
  res.json(resources);
});

// GET /api/resources/availability
router.get('/availability', authMiddleware, (_req: Request, res: Response) => {
  const resources = store.getResources();
  const availability = resources.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    total: r.totalCount,
    available: r.availableCount,
    occupied: r.occupiedCount,
    maintenance: r.maintenanceCount,
    utilizationPercent: Math.round((r.occupiedCount / r.totalCount) * 100),
    status: r.status,
  }));
  res.json(availability);
});

// GET /api/resources/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const resource = store.getResourceById(req.params.id);
  if (!resource) {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }
  res.json(resource);
});

// POST /api/resources (Admin only)
router.post('/', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const { name, category, totalCount, location, status, maxCapacity, metadata } = req.body;

  if (!name || !category || !totalCount) {
    res.status(400).json({ error: 'Name, category, and totalCount are required' });
    return;
  }

  const resource: Resource = {
    id: uuid(),
    name,
    category,
    totalCount,
    availableCount: totalCount,
    occupiedCount: 0,
    maintenanceCount: 0,
    location: location || '',
    status: status || 'active',
    maxCapacity,
    metadata: metadata || {
      lastMaintenance: new Date().toISOString(),
      purchaseDate: new Date().toISOString(),
      specifications: {},
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addResource(resource);
  res.status(201).json(resource);
});

// PUT /api/resources/:id (Admin only)
router.put('/:id', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const resource = store.getResourceById(req.params.id);
  if (!resource) {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  const updated = store.updateResource(req.params.id, req.body);
  res.json(updated);
});

// DELETE /api/resources/:id (Admin only)
router.delete('/:id', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const success = store.deleteResource(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }
  res.json({ message: 'Resource deleted' });
});

export default router;
