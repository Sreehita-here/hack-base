// ===== Shared TypeScript Types =====

// --- User & Auth ---
export type UserRole = 'admin' | 'doctor' | 'student';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  department: string;
  phone: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  department: string;
  phone: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// --- Resources ---
export type ResourceCategory = 'icu_bed' | 'general_bed' | 'ventilator' | 'lab' | 'equipment';
export type ResourceStatus = 'active' | 'maintenance' | 'offline';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  totalCount: number;
  availableCount: number;
  occupiedCount: number;
  maintenanceCount: number;
  location: string;
  status: ResourceStatus;
  maxCapacity?: number;
  metadata: {
    lastMaintenance: string;
    purchaseDate: string;
    specifications: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

// --- Requests ---
export type SeverityLevel = 'critical' | 'moderate' | 'mild';
export type RequestStatus = 'pending' | 'allocated' | 'queued' | 'rejected' | 'cancelled';

export interface ResourceRequest {
  id: string;
  userId: string;
  userName: string;
  resourceType: ResourceCategory;
  resourceId?: string;
  severity: SeverityLevel;
  basePriority: number;
  effectivePriority: number;
  status: RequestStatus;
  timestamp: string;
  queuePosition: number;
  priorityBoosts: number;
  isEmergency: boolean;
  boostNotified: boolean;
  details: {
    patientName?: string;
    patientId?: string;
    age?: number;
    gender?: string;
    condition?: string;
    existingConditions?: string[];
    allergies?: string[];
    duration?: number;
    durationUnit?: string;
    specialRequirements?: string;
    preferredLocation?: string;
    // Campus
    studentName?: string;
    studentId?: string;
    department?: string;
    course?: string;
    labType?: string;
    purpose?: string;
    participants?: number;
  };
}

// --- Allocations ---
export type AllocationStatus = 'active' | 'completed' | 'cancelled' | 'overridden';

export interface Allocation {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  requestId: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AllocationStatus;
  isEmergency: boolean;
}

// --- Bookings ---
export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  resourceId: string;
  resourceName: string;
  date: string;
  timeSlot: string;
  startHour: number;
  endHour: number;
  duration: number;
  equipment: string[];
  participants: number;
  purpose: string;
  status: BookingStatus;
  createdAt: string;
}

// --- Queue ---
export interface QueueEntry {
  requestId: string;
  userId: string;
  userName: string;
  resourceType: ResourceCategory;
  basePriority: number;
  currentPriority: number;
  timestamp: string;
  waitingTime: number;
  position: number;
  estimatedWait: number;
  severity: SeverityLevel;
  isEmergency: boolean;
  priorityBoosts: {
    waitTime: number;
    vulnerability: number;
    fairness: number;
  };
}

// --- Notifications ---
export type NotificationType =
  | 'allocation_success'
  | 'waitlist_update'
  | 'priority_boost'
  | 'no_availability'
  | 'booking_confirmed'
  | 'emergency_override'
  | 'booking_reminder'
  | 'resource_expiring'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

// --- Activity Feed ---
export type ActivityType =
  | 'allocation'
  | 'request_queued'
  | 'resource_released'
  | 'emergency_override'
  | 'priority_boosted'
  | 'request_cancelled'
  | 'resource_maintenance'
  | 'booking_created'
  | 'booking_cancelled';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  resourceId?: string;
  userId?: string;
  timestamp: string;
}

// --- System Settings ---
export interface SystemSettings {
  priorityWeights: {
    critical: number;
    moderate: number;
    mild: number;
  };
  antiStarvation: {
    boostStartThreshold: number;
    boostRate: number;
    maxBoostMultiplier: number;
    adminAlertThreshold: number;
  };
  booking: {
    maxDuration: number;
    advanceBookingDays: number;
    cancellationDeadlineHours: number;
    noShowPenalty: boolean;
  };
  system: {
    maxQueueSize: number;
    maxConcurrentBookingsPerUser: number;
    sessionTimeoutMinutes: number;
    queueRefreshIntervalSeconds: number;
  };
}

// --- API Responses ---
export interface AllocationResult {
  status: 'allocated' | 'queued';
  resource?: Resource;
  message: string;
  estimatedDuration?: number;
  queuePosition?: number;
  estimatedWait?: number;
  totalInQueue?: number;
}

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  canProceed: boolean;
}

export interface Conflict {
  type: 'double_booking' | 'user_overlap' | 'equipment_unavailable' | 'capacity_exceeded' | 'maintenance_window';
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
  conflictingBooking?: Booking;
}

// --- Dashboard ---
export interface DashboardStats {
  totalResources: number;
  totalAllocated: number;
  totalWaiting: number;
  criticalAlerts: number;
  utilizationPercent: number;
  todayAllocations: number;
  weekAllocations: number;
  monthAllocations: number;
  avgWaitTime: number;
  resourceBreakdown: {
    category: ResourceCategory;
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  }[];
  priorityDistribution: {
    critical: number;
    moderate: number;
    mild: number;
  };
  fairnessMetrics: {
    avgWaitByCritical: number;
    avgWaitByModerate: number;
    avgWaitByMild: number;
    longestCurrentWait: number;
    starvationIncidents: number;
    boostsToday: number;
    fairnessScore: number;
  };
}
