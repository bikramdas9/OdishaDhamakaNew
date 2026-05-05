import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../config/db';
import redis, { CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// GET /menu - all categories with items (cached)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = await redis.get(CACHE_KEYS.MENU);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const { rows: categories } = await pool.query(
      `SELECT id, name, description, image_url, display_order
       FROM categories WHERE is_active = true ORDER BY display_order`
    );

    const { rows: items } = await pool.query(
      `SELECT id, category_id, name, description, price, image_url, is_vegetarian, display_order
       FROM menu_items WHERE is_available = true ORDER BY category_id, display_order`
    );

    const data = categories.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.category_id === cat.id),
    }));

    await redis.set(CACHE_KEYS.MENU, data, { ex: CACHE_TTL.MENU });
    res.json({ success: true, data });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch menu' });
  }
});

// Admin: Add category
const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  display_order: z.number().int().default(0),
});

router.post('/categories', authenticate, requireAdmin, validate(categorySchema), async (req: AuthRequest, res: Response) => {
  const { name, description, image_url, display_order } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO categories (name, description, image_url, display_order) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description, image_url, display_order]
  );
  await redis.del(CACHE_KEYS.MENU);
  res.status(201).json({ success: true, data: rows[0] });
});

// Admin: Add menu item
const menuItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(2).max(150),
  description: z.string().optional(),
  price: z.number().positive(),
  image_url: z.string().url().optional(),
  is_vegetarian: z.boolean().default(false),
  display_order: z.number().int().default(0),
});

router.post('/items', authenticate, requireAdmin, validate(menuItemSchema), async (req: AuthRequest, res: Response) => {
  const { category_id, name, description, price, image_url, is_vegetarian, display_order } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO menu_items (category_id, name, description, price, image_url, is_vegetarian, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [category_id, name, description, price, image_url, is_vegetarian, display_order]
  );
  await redis.del(CACHE_KEYS.MENU);
  res.status(201).json({ success: true, data: rows[0] });
});

// Admin: Toggle item availability
router.patch('/items/:id/availability', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_available } = req.body;
  await pool.query('UPDATE menu_items SET is_available = $1 WHERE id = $2', [is_available, id]);
  await redis.del(CACHE_KEYS.MENU);
  res.json({ success: true, message: 'Updated' });
});

// Admin: Update item price
router.patch('/items/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { price, name, description, is_available } = req.body;
  const { rows } = await pool.query(
    `UPDATE menu_items SET price = COALESCE($1, price), name = COALESCE($2, name),
     description = COALESCE($3, description), is_available = COALESCE($4, is_available)
     WHERE id = $5 RETURNING *`,
    [price, name, description, is_available, id]
  );
  await redis.del(CACHE_KEYS.MENU);
  res.json({ success: true, data: rows[0] });
});

export default router;
