import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { store } from '../store/DataStore';
import { DashboardStats } from '../types';
import { handleEmergencyOverride } from '../engine/emergency';

const router = Router();

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, (_req: Request, res: Response) => {
  const resources = store.getResources();
  const requests = store.getRequests();
  const allocations = store.getAllocations();
  const settings = store.getSettings();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const activeAllocations = allocations.filter(a => a.status === 'active');
  const queuedRequests = requests.filter(r => r.status === 'queued');
  const criticalQueued = queuedRequests.filter(r => r.severity === 'critical' || r.isEmergency);

  const totalCapacity = resources.reduce((sum, r) => sum + r.totalCount, 0);
  const totalOccupied = resources.reduce((sum, r) => sum + r.occupiedCount, 0);

  // Wait time calculations
  const waitTimes = queuedRequests.map(r => (Date.now() - new Date(r.timestamp).getTime()) / 60000);
  const avgWaitTime = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

  const stats: DashboardStats = {
    totalResources: totalCapacity,
    totalAllocated: totalOccupied,
    totalWaiting: queuedRequests.length,
    criticalAlerts: criticalQueued.length,
    utilizationPercent: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
    todayAllocations: allocations.filter(a => a.startTime >= todayStart).length,
    weekAllocations: allocations.filter(a => a.startTime >= weekStart).length,
    monthAllocations: allocations.filter(a => a.startTime >= monthStart).length,
    avgWaitTime,
    resourceBreakdown: resources.map(r => ({
      category: r.category,
      total: r.totalCount,
      available: r.availableCount,
      occupied: r.occupiedCount,
      maintenance: r.maintenanceCount,
    })),
    priorityDistribution: {
      critical: requests.filter(r => r.severity === 'critical').length,
      moderate: requests.filter(r => r.severity === 'moderate').length,
      mild: requests.filter(r => r.severity === 'mild').length,
    },
    fairnessMetrics: {
      avgWaitByCritical: calculateAvgWait(queuedRequests.filter(r => r.severity === 'critical')),
      avgWaitByModerate: calculateAvgWait(queuedRequests.filter(r => r.severity === 'moderate')),
      avgWaitByMild: calculateAvgWait(queuedRequests.filter(r => r.severity === 'mild')),
      longestCurrentWait: waitTimes.length > 0 ? Math.round(Math.max(...waitTimes)) : 0,
      starvationIncidents: 0,
      boostsToday: queuedRequests.filter(r => r.priorityBoosts > 0).length,
      fairnessScore: 94,
    },
  };

  res.json(stats);
});

function calculateAvgWait(requests: any[]): number {
  if (requests.length === 0) return 0;
  const total = requests.reduce((sum: number, r: any) => sum + (Date.now() - new Date(r.timestamp).getTime()) / 60000, 0);
  return Math.round(total / requests.length);
}

// GET /api/admin/analytics
router.get('/analytics', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const activities = store.getActivities(50);
  res.json(activities);
});

// POST /api/admin/override
router.post('/override', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const { requestId, reason } = req.body;
  const request = store.getRequestById(requestId);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const result = handleEmergencyOverride(request);
  res.json(result);
});

// GET /api/admin/users
router.get('/users', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const users = store.getUsers().map(u => {
    const { password, ...userPublic } = u;
    return {
      ...userPublic,
      totalRequests: store.getRequestsByUser(u.id).length,
      activeAllocations: store.getAllocationsByUser(u.id).filter(a => a.status === 'active').length,
      totalBookings: store.getBookingsByUser(u.id).length,
    };
  });
  res.json(users);
});

// PUT /api/admin/users/:id
router.put('/users/:id', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const user = store.updateUser(req.params.id, req.body);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { password, ...userPublic } = user;
  res.json(userPublic);
});

// GET /api/admin/settings
router.get('/settings', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  res.json(store.getSettings());
});

// PUT /api/admin/settings
router.put('/settings', authMiddleware, roleGuard('admin'), (req: Request, res: Response) => {
  const updated = store.updateSettings(req.body);
  res.json(updated);
});

// GET /api/admin/notifications
router.get('/notifications', authMiddleware, (req: Request, res: Response) => {
  const notifications = store.getNotificationsByUser(req.user!.userId);
  const unreadCount = store.getUnreadCount(req.user!.userId);
  res.json({ notifications, unreadCount });
});

// PUT /api/admin/notifications/read-all
router.put('/notifications/read-all', authMiddleware, (req: Request, res: Response) => {
  store.markAllRead(req.user!.userId);
  res.json({ message: 'All marked as read' });
});

// PUT /api/admin/notifications/:id/read
router.put('/notifications/:id/read', authMiddleware, (req: Request, res: Response) => {
  store.markNotificationRead(req.params.id);
  res.json({ message: 'Marked as read' });
});

export default router;
