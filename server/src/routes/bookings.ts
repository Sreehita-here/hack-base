import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { store } from '../store/DataStore';
import { Booking } from '../types';
import { detectConflicts, findAlternativeSlots } from '../engine/conflictDetection';
import { suggestBestTimeSlots, getDemandAnalytics } from '../engine/scheduling';
import { createNotification } from '../services/notification';

const router = Router();

// POST /api/bookings
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { resourceId, date, startHour, endHour, duration, equipment, participants, purpose } = req.body;
    const user = store.getUserById(req.user!.userId);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const resource = store.getResourceById(resourceId);
    if (!resource) { res.status(404).json({ error: 'Resource not found' }); return; }

    // Detect conflicts
    const conflictResult = detectConflicts({
      resourceId,
      userId: user.id,
      date,
      startHour,
      endHour,
      participants,
      equipment,
    });

    if (conflictResult.hasConflicts && !conflictResult.canProceed) {
      // Find alternative slots
      const alternatives = findAlternativeSlots(resourceId, date, duration || (endHour - startHour));

      res.status(409).json({
        error: 'Booking conflicts detected',
        conflicts: conflictResult.conflicts,
        alternatives,
      });
      return;
    }

    const booking: Booking = {
      id: uuid(),
      userId: user.id,
      userName: user.name,
      resourceId,
      resourceName: resource.name,
      date,
      timeSlot: `${startHour}:00 - ${endHour}:00`,
      startHour,
      endHour,
      duration: duration || (endHour - startHour),
      equipment: equipment || [],
      participants: participants || 1,
      purpose: purpose || '',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    store.addBooking(booking);

    // Notify user
    createNotification({
      userId: user.id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed! ✅',
      message: `${resource.name} booked for ${date} at ${startHour}:00 - ${endHour}:00`,
      priority: 'high',
      actionUrl: '/bookings',
      actionLabel: 'View Booking',
    });

    store.addActivity({
      id: uuid(),
      type: 'booking_created',
      title: 'Lab Booked',
      description: `${resource.name} booked by ${user.name} for ${date}`,
      resourceId: resource.id,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/user/:userId
router.get('/user/:userId', authMiddleware, (req: Request, res: Response) => {
  res.json(store.getBookingsByUser(req.params.userId));
});

// GET /api/bookings/check-conflict
router.get('/check-conflict', authMiddleware, (req: Request, res: Response) => {
  const { resourceId, date, startHour, endHour, participants } = req.query;
  const result = detectConflicts({
    resourceId: resourceId as string,
    userId: req.user!.userId,
    date: date as string,
    startHour: parseInt(startHour as string),
    endHour: parseInt(endHour as string),
    participants: participants ? parseInt(participants as string) : undefined,
  });
  res.json(result);
});

// GET /api/bookings/available-slots
router.get('/available-slots', authMiddleware, (req: Request, res: Response) => {
  const { resourceId, date, duration } = req.query;
  const suggestions = suggestBestTimeSlots(
    resourceId as string,
    date as string,
    parseInt(duration as string) || 1
  );
  res.json(suggestions);
});

// GET /api/bookings/demand-analytics
router.get('/demand-analytics', authMiddleware, (_req: Request, res: Response) => {
  res.json(getDemandAnalytics());
});

// GET /api/bookings
router.get('/', authMiddleware, (req: Request, res: Response) => {
  if (req.user!.role === 'admin') {
    res.json(store.getBookings());
  } else {
    res.json(store.getBookingsByUser(req.user!.userId));
  }
});

// GET /api/bookings/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const booking = store.getBookings().find(b => b.id === req.params.id);
  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
  res.json(booking);
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authMiddleware, (req: Request, res: Response) => {
  const booking = store.getBookings().find(b => b.id === req.params.id);
  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
  if (booking.userId !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized' }); return;
  }

  store.updateBooking(req.params.id, { status: 'cancelled' });

  store.addActivity({
    id: uuid(),
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    description: `${booking.resourceName} booking cancelled by ${booking.userName}`,
    resourceId: booking.resourceId,
    userId: booking.userId,
    timestamp: new Date().toISOString(),
  });

  res.json({ message: 'Booking cancelled' });
});

export default router;
