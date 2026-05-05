import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { sendOTP, verifyOTP } from '../services/otp';
import { validate } from '../middleware/validate';
import { otpLimiter, authLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const mobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  address_line: z.string().min(5).max(255).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});

const verifyOTPSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6).regex(/^\d+$/),
});

// Send OTP for login
router.post('/send-otp', otpLimiter, validate(mobileSchema), async (req: Request, res: Response) => {
  const { mobile } = req.body;
  const result = await sendOTP(mobile);
  if (!result.success) {
    return res.status(429).json(result);
  }
  res.json(result);
});

// Verify OTP and login
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;

  const valid = await verifyOTP(mobile, otp);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  const { rows } = await pool.query(
    'SELECT id, name, mobile, role, is_active FROM users WHERE mobile = $1',
    [mobile]
  );

  if (!rows[0]) {
    return res.status(404).json({ success: false, message: 'User not registered', needsRegister: true });
  }

  if (!rows[0].is_active) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  const token = jwt.sign(
    { id: rows[0].id, mobile: rows[0].mobile, role: rows[0].role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login successful',
    user: { id: rows[0].id, name: rows[0].name, mobile: rows[0].mobile, role: rows[0].role },
    token,
  });
});

// Register new user (OTP already verified - send OTP first, verify mobile, then register)
router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  const { name, mobile, address_line, city, state, pincode } = req.body;

  const existing = await pool.query('SELECT id FROM users WHERE mobile = $1', [mobile]);
  if (existing.rows[0]) {
    return res.status(409).json({ success: false, message: 'Mobile number already registered' });
  }

  const isAdmin = mobile === process.env.ADMIN_MOBILE;
  const role = isAdmin ? 'admin' : 'customer';

  const { rows } = await pool.query(
    `INSERT INTO users (name, mobile, address_line, city, state, pincode, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, mobile, role`,
    [name, mobile, address_line, city, state, pincode, role]
  );

  const token = jwt.sign(
    { id: rows[0].id, mobile: rows[0].mobile, role: rows[0].role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: rows[0],
    token,
  });
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    'SELECT id, name, mobile, address_line, city, state, pincode, role FROM users WHERE id = $1',
    [req.user!.id]
  );
  res.json({ success: true, user: rows[0] });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
