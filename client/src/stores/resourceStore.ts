import { create } from 'zustand';
import api from '../lib/api';

interface Resource {
  id: string;
  name: string;
  category: string;
  totalCount: number;
  availableCount: number;
  occupiedCount: number;
  maintenanceCount: number;
  location: string;
  status: string;
  maxCapacity?: number;
  metadata: any;
}

interface DashboardStats {
  totalResources: number;
  totalAllocated: number;
  totalWaiting: number;
  criticalAlerts: number;
  utilizationPercent: number;
  todayAllocations: number;
  weekAllocations: number;
  monthAllocations: number;
  avgWaitTime: number;
  resourceBreakdown: any[];
  priorityDistribution: { critical: number; moderate: number; mild: number };
  fairnessMetrics: any;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface ResourceState {
  resources: Resource[];
  dashboardStats: DashboardStats | null;
  activities: Activity[];
  queue: any[];
  allocations: any[];
  bookings: any[];
  requests: any[];
  isLoading: boolean;
  fetchResources: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  fetchQueue: (resourceType: string) => Promise<void>;
  fetchAllocations: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  addResource: (data: any) => Promise<void>;
  updateResource: (id: string, data: any) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
}

export const useResourceStore = create<ResourceState>((set) => ({
  resources: [],
  dashboardStats: null,
  activities: [],
  queue: [],
  allocations: [],
  bookings: [],
  requests: [],
  isLoading: false,

  fetchResources: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/resources');
      set({ resources: res.data, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchDashboard: async () => {
    try {
      const res = await api.get('/admin/dashboard');
      set({ dashboardStats: res.data });
    } catch { /* ignore */ }
  },

  fetchActivities: async () => {
    try {
      const res = await api.get('/admin/analytics');
      set({ activities: res.data });
    } catch { /* ignore */ }
  },

  fetchQueue: async (resourceType) => {
    try {
      const res = await api.get(`/requests/queue/${resourceType}`);
      set({ queue: res.data });
    } catch { /* ignore */ }
  },

  fetchAllocations: async () => {
    try {
      const res = await api.get('/allocations/active');
      set({ allocations: res.data });
    } catch { /* ignore */ }
  },

  fetchBookings: async () => {
    try {
      const res = await api.get('/bookings');
      set({ bookings: res.data });
    } catch { /* ignore */ }
  },

  fetchRequests: async () => {
    try {
      const res = await api.get('/requests');
      set({ requests: res.data });
    } catch { /* ignore */ }
  },

  addResource: async (data) => {
    await api.post('/resources', data);
    const res = await api.get('/resources');
    set({ resources: res.data });
  },

  updateResource: async (id, data) => {
    await api.put(`/resources/${id}`, data);
    const res = await api.get('/resources');
    set({ resources: res.data });
  },

  deleteResource: async (id) => {
    await api.delete(`/resources/${id}`);
    const res = await api.get('/resources');
    set({ resources: res.data });
  },
}));
