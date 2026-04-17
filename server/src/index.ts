import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { setupSocketHandlers } from './socket/handler';

// Routes
import authRoutes from './routes/auth';
import resourceRoutes from './routes/resources';
import requestRoutes from './routes/requests';
import allocationRoutes from './routes/allocations';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Socket handlers
setupSocketHandlers(io);

// Start
httpServer.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  🏥 Smart Resource Allocation Server         ║
  ║  Running on port ${config.port}                      ║
  ║  Environment: ${config.nodeEnv}               ║
  ║  API: http://localhost:${config.port}/api              ║
  ╚══════════════════════════════════════════════╝
  `);
});

export { io };
