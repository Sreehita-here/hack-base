import fs from 'fs';
import path from 'path';
import bcryptjs from 'bcryptjs';
import { config } from '../config';
import {
  User, Resource, ResourceRequest, Allocation, Booking,
  Notification, Activity, SystemSettings
} from '../types';
import { seedData } from './seed';

interface StoreData {
  users: User[];
  resources: Resource[];
  requests: ResourceRequest[];
  allocations: Allocation[];
  bookings: Booking[];
  notifications: Notification[];
  activities: Activity[];
  settings: SystemSettings;
}

class DataStore {
  private data: StoreData;
  private filePath: string;

  constructor() {
    this.filePath = path.join(config.dataDir, 'store.json');
    this.data = this.load();
  }

  private load(): StoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw) as StoreData;
        
        // Force sync demo account passwords to match the frontend demo buttons
        const demoCreds: Record<string, string> = {
          'admin@hospital.com': 'AdminDemo$2026',
          'doctor@hospital.com': 'DoctorDemo$2026',
          'student@campus.edu': 'StudentDemo$2026'
        };
        
        data.users.forEach(u => {
          if (demoCreds[u.email] && !bcryptjs.compareSync(demoCreds[u.email], u.password)) {
            u.password = bcryptjs.hashSync(demoCreds[u.email], 10);
          }
        });
        
        return data;
      }
    } catch (err) {
      console.log('No existing data file found, loading seed data...');
    }
    return seedData();
  }

  save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  }

  reset(): void {
    this.data = seedData();
    this.save();
  }

  // === Users ===
  getUsers(): User[] { return this.data.users; }
  getUserById(id: string): User | undefined { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined { return this.data.users.find(u => u.email === email); }
  addUser(user: User): void { this.data.users.push(user); this.save(); }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // === Resources ===
  getResources(): Resource[] { return this.data.resources; }
  getResourceById(id: string): Resource | undefined { return this.data.resources.find(r => r.id === id); }
  getResourcesByCategory(category: string): Resource[] { return this.data.resources.filter(r => r.category === category); }
  addResource(resource: Resource): void { this.data.resources.push(resource); this.save(); }
  updateResource(id: string, updates: Partial<Resource>): Resource | undefined {
    const idx = this.data.resources.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.data.resources[idx] = { ...this.data.resources[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.resources[idx];
  }
  deleteResource(id: string): boolean {
    const idx = this.data.resources.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.resources.splice(idx, 1);
    this.save();
    return true;
  }

  // === Requests ===
  getRequests(): ResourceRequest[] { return this.data.requests; }
  getRequestById(id: string): ResourceRequest | undefined { return this.data.requests.find(r => r.id === id); }
  getRequestsByUser(userId: string): ResourceRequest[] { return this.data.requests.filter(r => r.userId === userId); }
  getRequestsByStatus(status: string): ResourceRequest[] { return this.data.requests.filter(r => r.status === status); }
  getQueueByResourceType(resourceType: string): ResourceRequest[] {
    return this.data.requests
      .filter(r => r.resourceType === resourceType && r.status === 'queued')
      .sort((a, b) => {
        if (a.effectivePriority !== b.effectivePriority) return b.effectivePriority - a.effectivePriority;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }
  addRequest(request: ResourceRequest): void { this.data.requests.push(request); this.save(); }
  updateRequest(id: string, updates: Partial<ResourceRequest>): ResourceRequest | undefined {
    const idx = this.data.requests.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.data.requests[idx] = { ...this.data.requests[idx], ...updates };
    this.save();
    return this.data.requests[idx];
  }
  getRecentAllocationsCount(userId: string, hoursBack: number = 24): number {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    return this.data.requests.filter(
      r => r.userId === userId && r.status === 'allocated' && r.timestamp > cutoff
    ).length;
  }

  // === Allocations ===
  getAllocations(): Allocation[] { return this.data.allocations; }
  getActiveAllocations(): Allocation[] { return this.data.allocations.filter(a => a.status === 'active'); }
  getAllocationsByUser(userId: string): Allocation[] { return this.data.allocations.filter(a => a.userId === userId); }
  getAllocationsByResource(resourceId: string): Allocation[] {
    return this.data.allocations.filter(a => a.resourceId === resourceId && a.status === 'active');
  }
  addAllocation(allocation: Allocation): void { this.data.allocations.push(allocation); this.save(); }
  updateAllocation(id: string, updates: Partial<Allocation>): Allocation | undefined {
    const idx = this.data.allocations.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.data.allocations[idx] = { ...this.data.allocations[idx], ...updates };
    this.save();
    return this.data.allocations[idx];
  }

  // === Bookings ===
  getBookings(): Booking[] { return this.data.bookings; }
  getBookingsByUser(userId: string): Booking[] { return this.data.bookings.filter(b => b.userId === userId); }
  getBookingsByResource(resourceId: string): Booking[] { return this.data.bookings.filter(b => b.resourceId === resourceId && b.status === 'confirmed'); }
  getBookingsByDate(resourceId: string, date: string): Booking[] {
    return this.data.bookings.filter(b => b.resourceId === resourceId && b.date === date && b.status === 'confirmed');
  }
  addBooking(booking: Booking): void { this.data.bookings.push(booking); this.save(); }
  updateBooking(id: string, updates: Partial<Booking>): Booking | undefined {
    const idx = this.data.bookings.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    this.data.bookings[idx] = { ...this.data.bookings[idx], ...updates };
    this.save();
    return this.data.bookings[idx];
  }

  // === Notifications ===
  getNotifications(): Notification[] { return this.data.notifications; }
  getNotificationsByUser(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getUnreadCount(userId: string): number {
    return this.data.notifications.filter(n => n.userId === userId && !n.read).length;
  }
  addNotification(notification: Notification): void { this.data.notifications.push(notification); this.save(); }
  markNotificationRead(id: string): void {
    const n = this.data.notifications.find(n => n.id === id);
    if (n) { n.read = true; this.save(); }
  }
  markAllRead(userId: string): void {
    this.data.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
    this.save();
  }

  // === Activities ===
  getActivities(limit: number = 50): Activity[] {
    return this.data.activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  addActivity(activity: Activity): void {
    this.data.activities.push(activity);
    if (this.data.activities.length > 200) {
      this.data.activities = this.data.activities.slice(-200);
    }
    this.save();
  }

  // === Settings ===
  getSettings(): SystemSettings { return this.data.settings; }
  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }
}

export const store = new DataStore();
