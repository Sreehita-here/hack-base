import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { store } from '../store/DataStore';
import { authMiddleware } from '../middleware/auth';
import { User, UserRole } from '../types';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, department, phone } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Email, password, name, and role are required' });
      return;
    }

    // Check if user exists
    if (store.getUserByEmail(email)) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Validate role
    const validRoles: UserRole[] = ['admin', 'doctor', 'student'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    const user: User = {
      id: uuid(),
      email,
      password: hashedPassword,
      name,
      role,
      department: department || '',
      phone: phone || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
    };

    store.addUser(user);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const { password: _, ...userPublic } = user;
    res.status(201).json({ user: userPublic, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = store.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }

    // Update last login
    store.updateUser(user.id, { lastLogin: new Date().toISOString() });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const { password: _, ...userPublic } = user;
    res.json({ user: userPublic, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const user = store.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { password: _, ...userPublic } = user;
  res.json(userPublic);
});

// POST /api/auth/refresh
router.post('/refresh', authMiddleware, (req: Request, res: Response) => {
  const token = jwt.sign(
    { userId: req.user!.userId, email: req.user!.email, role: req.user!.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  res.json({ token });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
