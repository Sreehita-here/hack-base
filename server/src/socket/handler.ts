import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../types';
import { updateAllPriorities } from '../engine/antiStarvation';

let io: Server;

export function setupSocketHandlers(socketServer: Server): void {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Authenticate
    socket.on('authenticate', (data: { token: string }) => {
      try {
        const decoded = jwt.verify(data.token, config.jwtSecret) as JWTPayload;
        socket.data.user = decoded;
        socket.join(`user:${decoded.userId}`);
        socket.join(`role:${decoded.role}`);
        socket.emit('authenticated', { userId: decoded.userId });
        console.log(`[Socket] Authenticated: ${decoded.email}`);
      } catch {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // Subscribe to channels
    socket.on('subscribe', (data: { channels: string[] }) => {
      data.channels.forEach(channel => {
        socket.join(channel);
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Periodic priority updates (anti-starvation)
  setInterval(() => {
    const result = updateAllPriorities();
    if (result.boostedUsers.length > 0) {
      // Notify affected users
      result.boostedUsers.forEach(userId => {
        io.to(`user:${userId}`).emit('priority_boosted', { userId });
      });
      // Broadcast queue update
      io.emit('queue_updated', { timestamp: new Date().toISOString() });
    }
  }, 30000); // Every 30 seconds
}

// Helper to emit events from anywhere
export function emitToAll(event: string, data: any): void {
  if (io) io.emit(event, data);
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: any): void {
  if (io) io.to(`role:${role}`).emit(event, data);
}
