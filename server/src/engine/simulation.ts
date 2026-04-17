import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { store } from '../store/DataStore';
import { Activity, Resource } from '../types';

// Simulation config — tuneable per category
const SIM_CONFIG = {
  icu_bed:      { intervalMs: 6000,  allocateChance: 0.3, freeChance: 0.2, maintenanceChance: 0.05 },
  general_bed:  { intervalMs: 5000,  allocateChance: 0.35, freeChance: 0.25, maintenanceChance: 0.04 },
  ventilator:   { intervalMs: 8000,  allocateChance: 0.2, freeChance: 0.1, maintenanceChance: 0.03 },
  lab:          { intervalMs: 12000, allocateChance: 0.15, freeChance: 0.2, maintenanceChance: 0.02 },
  equipment:    { intervalMs: 10000, allocateChance: 0.15, freeChance: 0.2, maintenanceChance: 0.02 },
};

const PATIENT_NAMES = [
  'Patient A. Kumar', 'Patient R. Sharma', 'Patient J. Doe', 'Patient M. Chen',
  'Patient L. Garcia', 'Patient S. Patel', 'Patient K. Williams', 'Patient N. Singh',
  'Patient D. Brown', 'Patient T. Anderson', 'Patient P. Martinez', 'Patient V. Lee',
];

const LAB_ACTIONS = [
  'Lab slot reserved for Physics practical',
  'Chemistry Lab booked for experiment',
  'Computer Lab session started',
  'Biology Lab reserved for research',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pushActivity(type: Activity['type'], title: string, description: string, resourceId?: string) {
  const activity: Activity = {
    id: uuid(),
    type,
    title,
    description,
    resourceId,
    timestamp: new Date().toISOString(),
  };
  store.addActivity(activity);
  return activity;
}

function simulateResource(resource: Resource): Activity | null {
  const cfg = SIM_CONFIG[resource.category as keyof typeof SIM_CONFIG];
  if (!cfg) return null;

  const roll = Math.random();

  // --- ALLOCATE: move one from available → occupied ---
  if (roll < cfg.allocateChance && resource.availableCount > 0) {
    const updates = {
      availableCount: resource.availableCount - 1,
      occupiedCount: resource.occupiedCount + 1,
    };
    store.updateResource(resource.id, updates);

    const patient = pick(PATIENT_NAMES);
    const desc = resource.category === 'lab'
      ? pick(LAB_ACTIONS)
      : `${resource.name} allocated to ${patient}`;
    return pushActivity('allocation', `${resource.name} — Allocated`, desc, resource.id);
  }

  // --- FREE: move one from occupied → available ---
  if (roll < cfg.allocateChance + cfg.freeChance && resource.occupiedCount > 0) {
    const updates = {
      availableCount: resource.availableCount + 1,
      occupiedCount: resource.occupiedCount - 1,
    };
    store.updateResource(resource.id, updates);

    const desc = resource.category === 'lab'
      ? `${resource.name} session completed`
      : `${resource.name} released — unit now available`;
    return pushActivity('resource_released', `${resource.name} — Released`, desc, resource.id);
  }

  // --- MAINTENANCE: move one from available → maintenance ---
  if (roll < cfg.allocateChance + cfg.freeChance + cfg.maintenanceChance && resource.availableCount > 0) {
    const updates = {
      availableCount: resource.availableCount - 1,
      maintenanceCount: resource.maintenanceCount + 1,
    };
    store.updateResource(resource.id, updates);

    return pushActivity('resource_maintenance', `${resource.name} — Maintenance`, `Scheduled maintenance started for ${resource.name}`, resource.id);
  }

  // --- MAINTENANCE COMPLETE: move one from maintenance → available ---
  if (resource.maintenanceCount > 0 && Math.random() < 0.15) {
    const updates = {
      availableCount: resource.availableCount + 1,
      maintenanceCount: resource.maintenanceCount - 1,
    };
    store.updateResource(resource.id, updates);

    return pushActivity('resource_released', `${resource.name} — Maintenance Done`, `${resource.name} returned from maintenance`, resource.id);
  }

  return null;
}

export function startSimulationEngine(io: Server): void {
  console.log('[Simulation] Digital Twin engine started');

  // Run simulation ticks at the fastest interval (5s) and check per-category timing internally
  const lastRun: Record<string, number> = {};

  setInterval(() => {
    const resources = store.getResources();
    const now = Date.now();
    let changed = false;

    resources.forEach(resource => {
      const cfg = SIM_CONFIG[resource.category as keyof typeof SIM_CONFIG];
      if (!cfg) return;

      const key = resource.id;
      if (!lastRun[key]) lastRun[key] = 0;

      if (now - lastRun[key] < cfg.intervalMs) return; // skip if not enough time elapsed
      lastRun[key] = now;

      const activity = simulateResource(resource);
      if (activity) {
        changed = true;
      }
    });

    if (changed) {
      // Broadcast to all connected clients
      io.emit('resources_updated', { timestamp: new Date().toISOString() });
      io.emit('dashboard_updated', { timestamp: new Date().toISOString() });
      io.emit('activities_updated', { timestamp: new Date().toISOString() });
    }
  }, 3000); // Check every 3 seconds
}
