import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import pool from '../config/db';
import razorpay from '../config/razorpay';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { orderLimiter } from '../middleware/rateLimiter';

const router = Router();

const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(20),
  delivery_address: z.string().min(10).max(500),
  special_instructions: z.string().max(300).optional(),
});

// Create order + Razorpay order
router.post('/', authenticate, orderLimiter, validate(createOrderSchema), async (req: AuthRequest, res: Response) => {
  const { items, delivery_address, special_instructions } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const itemIds = items.map((i: { menu_item_id: string }) => i.menu_item_id);
    const { rows: menuItems } = await client.query(
      `SELECT id, name, price, is_available FROM menu_items WHERE id = ANY($1::uuid[])`,
      [itemIds]
    );

    // Validate all items exist and are available
    for (const item of items) {
      const menuItem = menuItems.find((m: { id: string; name: string; is_available: boolean }) => m.id === item.menu_item_id);
      if (!menuItem) throw new Error(`Item ${item.menu_item_id} not found`);
      if (!menuItem.is_available) throw new Error(`${menuItem.name} is currently unavailable`);
    }

    const totalAmount = items.reduce((sum: number, item: { menu_item_id: string; quantity: number }) => {
      const menuItem = menuItems.find((m: { id: string; price: string }) => m.id === item.menu_item_id)!;
      return sum + parseFloat(menuItem.price) * item.quantity;
    }, 0);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt: `od_${Date.now()}`,
    });

    // Create order in DB
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, total_amount, delivery_address, special_instructions, razorpay_order_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.id, totalAmount, delivery_address, special_instructions, razorpayOrder.id]
    );

    // Insert order items
    for (const item of items) {
      const menuItem = menuItems.find((m: { id: string; name: string; price: string }) => m.id === item.menu_item_id)!;
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, menuItem.name, menuItem.price, item.quantity]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        razorpay_order_id: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const message = err instanceof Error ? err.message : 'Failed to create order';
    res.status(400).json({ success: false, message });
  } finally {
    client.release();
  }
});

// Verify Razorpay payment signature
router.post('/verify-payment', authenticate, async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
    return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await pool.query(
      `UPDATE orders SET payment_status = 'failed' WHERE id = $1 AND user_id = $2`,
      [order_id, req.user!.id]
    );
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const { rows } = await pool.query(
    `UPDATE orders
     SET payment_status = 'paid', status = 'confirmed',
         razorpay_payment_id = $1, razorpay_signature = $2
     WHERE id = $3 AND user_id = $4 AND razorpay_order_id = $5
     RETURNING *`,
    [razorpay_payment_id, razorpay_signature, order_id, req.user!.id, razorpay_order_id]
  );

  if (!rows[0]) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.json({ success: true, message: 'Payment confirmed', order: rows[0] });
});

// Get user's orders
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.payment_status, o.delivery_address,
            o.special_instructions, o.created_at,
            json_agg(json_build_object(
              'name', oi.name, 'price', oi.price, 'quantity', oi.quantity
            ) ORDER BY oi.created_at) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 20`,
    [req.user!.id]
  );
  res.json({ success: true, orders: rows });
});

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT o.*, json_agg(json_build_object(
       'name', oi.name, 'price', oi.price, 'quantity', oi.quantity
     ) ORDER BY oi.created_at) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1 AND (o.user_id = $2 OR $3 = 'admin')
     GROUP BY o.id`,
    [req.params.id, req.user!.id, req.user!.role]
  );
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order: rows[0] });
});

// Admin: Get all orders
router.get('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.payment_status, o.delivery_address,
            o.special_instructions, o.created_at, o.razorpay_payment_id,
            u.name AS customer_name, u.mobile AS customer_mobile,
            json_agg(json_build_object(
              'name', oi.name, 'price', oi.price, 'quantity', oi.quantity
            ) ORDER BY oi.created_at) AS items
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id, u.name, u.mobile
     ORDER BY o.created_at DESC
     LIMIT 100`
  );
  res.json({ success: true, orders: rows });
});

// Admin: Update order status
const statusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
});

router.patch('/:id/status', authenticate, requireAdmin, validate(statusSchema), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status, updated_at`,
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order: rows[0] });
});

export default router;
