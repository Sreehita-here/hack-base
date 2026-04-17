import bcryptjs from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import {
  User, Resource, ResourceRequest, Allocation, Booking,
  Notification, Activity, SystemSettings
} from '../types';

export function seedData() {
  const now = new Date().toISOString();
  const hashSync = bcryptjs.hashSync;

  // --- Users ---
  const users: User[] = [
    {
      id: uuid(), email: 'admin@hospital.com', password: hashSync('AdminDemo$2026', 10),
      role: 'admin', name: 'Dr. Sarah Admin', department: 'Administration',
      phone: '555-0100', createdAt: now, lastLogin: now, isActive: true,
    },
    {
      id: uuid(), email: 'doctor@hospital.com', password: hashSync('DoctorDemo$2026', 10),
      role: 'doctor', name: 'Dr. James Wilson', department: 'Cardiology',
      phone: '555-0101', createdAt: now, lastLogin: now, isActive: true,
    },
    {
      id: uuid(), email: 'nurse@hospital.com', password: hashSync('NurseDemo$2026', 10),
      role: 'doctor', name: 'Nurse Emily Chen', department: 'Emergency',
      phone: '555-0102', createdAt: now, lastLogin: now, isActive: true,
    },
    {
      id: uuid(), email: 'student@campus.edu', password: hashSync('StudentDemo$2026', 10),
      role: 'student', name: 'Alex Johnson', department: 'Computer Science',
      phone: '555-0200', createdAt: now, lastLogin: now, isActive: true,
    },
    {
      id: uuid(), email: 'student2@campus.edu', password: hashSync('StudentDemo$2026', 10),
      role: 'student', name: 'Maria Garcia', department: 'Biology',
      phone: '555-0201', createdAt: now, lastLogin: now, isActive: true,
    },
  ];

  // --- Resources ---
  const resources: Resource[] = [
    {
      id: uuid(), name: 'ICU Beds - Wing A', category: 'icu_bed',
      totalCount: 20, availableCount: 5, occupiedCount: 12, maintenanceCount: 3,
      location: 'Building A, Floor 3', status: 'active', maxCapacity: 1,
      metadata: { lastMaintenance: now, purchaseDate: '2023-01-15', specifications: { type: 'Advanced ICU', ventilatorReady: 'Yes', monitoring: '24/7' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'General Beds - Wing B', category: 'general_bed',
      totalCount: 50, availableCount: 18, occupiedCount: 28, maintenanceCount: 4,
      location: 'Building B, Floor 1-3', status: 'active', maxCapacity: 1,
      metadata: { lastMaintenance: now, purchaseDate: '2022-06-01', specifications: { type: 'Standard Care', sharedRoom: 'Yes' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'Ventilators', category: 'ventilator',
      totalCount: 15, availableCount: 8, occupiedCount: 5, maintenanceCount: 2,
      location: 'Building A, Floor 2-3', status: 'active', maxCapacity: 1,
      metadata: { lastMaintenance: now, purchaseDate: '2023-03-20', specifications: { model: 'MedVent Pro 3000', modes: 'CPAP, BiPAP, Invasive' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'Physics Lab', category: 'lab',
      totalCount: 3, availableCount: 2, occupiedCount: 1, maintenanceCount: 0,
      location: 'Science Building, Floor 2', status: 'active', maxCapacity: 30,
      metadata: { lastMaintenance: now, purchaseDate: '2021-08-15', specifications: { type: 'Physics', equipment: 'Oscilloscopes, Optics Kits', software: 'LabVIEW' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'Chemistry Lab', category: 'lab',
      totalCount: 2, availableCount: 1, occupiedCount: 1, maintenanceCount: 0,
      location: 'Science Building, Floor 1', status: 'active', maxCapacity: 25,
      metadata: { lastMaintenance: now, purchaseDate: '2021-08-15', specifications: { type: 'Chemistry', equipment: 'Fume Hoods, Spectrometers', safetyRating: 'Level 3' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'Computer Lab', category: 'lab',
      totalCount: 4, availableCount: 3, occupiedCount: 1, maintenanceCount: 0,
      location: 'Tech Building, Floor 1-2', status: 'active', maxCapacity: 40,
      metadata: { lastMaintenance: now, purchaseDate: '2023-01-10', specifications: { type: 'Computer Science', workstations: '40', software: 'VS Code, Python, MATLAB' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'Biology Lab', category: 'lab',
      totalCount: 2, availableCount: 1, occupiedCount: 0, maintenanceCount: 1,
      location: 'Science Building, Floor 3', status: 'active', maxCapacity: 20,
      metadata: { lastMaintenance: now, purchaseDate: '2022-02-20', specifications: { type: 'Biology', equipment: 'Microscopes, Centrifuges', biosafety: 'Level 2' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: 'Microscopes', category: 'equipment',
      totalCount: 30, availableCount: 22, occupiedCount: 8, maintenanceCount: 0,
      location: 'Science Building, Storage', status: 'active',
      metadata: { lastMaintenance: now, purchaseDate: '2022-09-01', specifications: { model: 'Olympus CX43', magnification: '4x-100x' } },
      createdAt: now, updatedAt: now,
    },
    {
      id: uuid(), name: '3D Printers', category: 'equipment',
      totalCount: 5, availableCount: 3, occupiedCount: 2, maintenanceCount: 0,
      location: 'Tech Building, Maker Space', status: 'active',
      metadata: { lastMaintenance: now, purchaseDate: '2023-06-15', specifications: { model: 'Prusa i3 MK3S+', material: 'PLA, ABS, PETG' } },
      createdAt: now, updatedAt: now,
    },
  ];

  // --- Seed some requests in queue ---
  const requests: ResourceRequest[] = [
    {
      id: uuid(), userId: users[1].id, userName: 'Dr. James Wilson',
      resourceType: 'icu_bed', severity: 'critical', basePriority: 100,
      effectivePriority: 115, status: 'queued', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      queuePosition: 1, priorityBoosts: 15, isEmergency: false, boostNotified: false,
      details: { patientName: 'John Doe', patientId: 'P-001', age: 72, gender: 'Male', condition: 'Acute cardiac arrest, requires ICU monitoring', duration: 48, durationUnit: 'hours' },
    },
    {
      id: uuid(), userId: users[2].id, userName: 'Nurse Emily Chen',
      resourceType: 'icu_bed', severity: 'moderate', basePriority: 50,
      effectivePriority: 81, status: 'queued', timestamp: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
      queuePosition: 2, priorityBoosts: 31, isEmergency: false, boostNotified: true,
      details: { patientName: 'Jane Smith', patientId: 'P-002', age: 45, gender: 'Female', condition: 'Post-operative recovery, stable', duration: 24, durationUnit: 'hours' },
    },
    {
      id: uuid(), userId: users[1].id, userName: 'Dr. James Wilson',
      resourceType: 'ventilator', severity: 'critical', basePriority: 100,
      effectivePriority: 100, status: 'queued', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      queuePosition: 1, priorityBoosts: 0, isEmergency: false, boostNotified: false,
      details: { patientName: 'Bob Johnson', patientId: 'P-003', age: 3, gender: 'Male', condition: 'Severe respiratory distress', duration: 12, durationUnit: 'hours' },
    },
  ];

  // --- Seed some active allocations ---
  const allocations: Allocation[] = [
    {
      id: uuid(), resourceId: resources[0].id, resourceName: 'ICU Beds - Wing A',
      userId: users[1].id, userName: 'Dr. James Wilson', requestId: uuid(),
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      duration: 6, status: 'active', isEmergency: false,
    },
    {
      id: uuid(), resourceId: resources[2].id, resourceName: 'Ventilators',
      userId: users[2].id, userName: 'Nurse Emily Chen', requestId: uuid(),
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(),
      duration: 12, status: 'active', isEmergency: false,
    },
  ];

  // --- Seed bookings ---
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const bookings: Booking[] = [
    {
      id: uuid(), userId: users[3].id, userName: 'Alex Johnson',
      resourceId: resources[5].id, resourceName: 'Computer Lab',
      date: tomorrowStr, timeSlot: '10:00 - 12:00', startHour: 10, endHour: 12,
      duration: 2, equipment: [], participants: 5, purpose: 'Project Work',
      status: 'confirmed', createdAt: now,
    },
    {
      id: uuid(), userId: users[4].id, userName: 'Maria Garcia',
      resourceId: resources[4].id, resourceName: 'Chemistry Lab',
      date: tomorrowStr, timeSlot: '14:00 - 16:00', startHour: 14, endHour: 16,
      duration: 2, equipment: [resources[7].id], participants: 3, purpose: 'Research',
      status: 'confirmed', createdAt: now,
    },
  ];

  // --- Activities ---
  const activities: Activity[] = [
    { id: uuid(), type: 'allocation', title: 'ICU Bed Allocated', description: 'ICU-12 allocated to Dr. Wilson for patient John D.', resourceId: resources[0].id, userId: users[1].id, timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    { id: uuid(), type: 'request_queued', title: 'Request Queued', description: 'Lab-A requested by Student Alex Johnson', resourceId: resources[5].id, userId: users[3].id, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { id: uuid(), type: 'resource_released', title: 'Ventilator Released', description: 'Ventilator-7 freed, auto-assigned to queue #1', resourceId: resources[2].id, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    { id: uuid(), type: 'booking_created', title: 'Lab Booked', description: 'Computer Lab booked by Alex Johnson for tomorrow', resourceId: resources[5].id, userId: users[3].id, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  ];

  // --- Notifications ---
  const notifications: Notification[] = [
    { id: uuid(), userId: users[1].id, type: 'allocation_success', title: 'Resource Allocated', message: 'ICU Bed #12 is ready! Location: Building A, Floor 3', priority: 'high', read: false, actionUrl: '/dashboard', actionLabel: 'View Details', createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    { id: uuid(), userId: users[3].id, type: 'booking_confirmed', title: 'Booking Confirmed', message: 'Computer Lab booked for tomorrow at 10:00 AM', priority: 'high', read: false, actionUrl: '/bookings', actionLabel: 'View Booking', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { id: uuid(), userId: users[2].id, type: 'waitlist_update', title: 'Queue Update', message: "You've moved to position #2 in the ICU queue", priority: 'medium', read: true, actionUrl: '/queue', actionLabel: 'View Queue', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ];

  // --- Settings ---
  const settings: SystemSettings = {
    priorityWeights: { critical: 100, moderate: 50, mild: 20 },
    antiStarvation: { boostStartThreshold: 15, boostRate: 0.5, maxBoostMultiplier: 2.0, adminAlertThreshold: 120 },
    booking: { maxDuration: 4, advanceBookingDays: 14, cancellationDeadlineHours: 2, noShowPenalty: true },
    system: { maxQueueSize: 50, maxConcurrentBookingsPerUser: 3, sessionTimeoutMinutes: 30, queueRefreshIntervalSeconds: 30 },
  };

  return { users, resources, requests, allocations, bookings, notifications, activities, settings };
}
