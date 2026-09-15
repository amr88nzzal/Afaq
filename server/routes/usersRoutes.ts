/**
 * ============================================================================
 * مسارات إدارة المستخدمين والمستشارين (Staff & Users API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب قائمة الموظفين والمستشارين
 * GET /api/users
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT id, name, email, phone, role, telegram_id, is_active, created_at FROM users ORDER BY id ASC'
      );
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.users });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إضافة مستشار أو مشرف جديد
 * POST /api/users
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, telegram_id } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'الاسم والبريد الإلكتروني حقول إلزامية' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, role, telegram_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, name, email, phone, role, telegram_id, is_active, created_at`,
        [name, email, phone, password || 'afaq2026', role || 'counselor', telegram_id]
      );
      return res.status(201).json({ success: true, message: 'تم إضافة المستخدم بنجاح', data: result.rows[0] });
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      role: role || 'counselor',
      telegram_id,
      is_active: true,
    };
    inMemoryStore.users.push(newUser);
    return res.status(201).json({ success: true, message: 'تم إضافة المستخدم بنجاح', data: newUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تعديل بيانات مستخدم
 * PUT /api/users/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, email, phone, password, role, telegram_id, is_active } = req.body;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE users SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           password_hash = CASE WHEN $4::text IS NOT NULL AND $4 <> '' THEN $4 ELSE password_hash END,
           role = COALESCE($5, role),
           telegram_id = COALESCE($6, telegram_id),
           is_active = COALESCE($7, is_active)
         WHERE id = $8
         RETURNING id, name, email, phone, role, telegram_id, is_active, created_at`,
        [name, email, phone, password, role, telegram_id, is_active, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
      return res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    inMemoryStore.users[index] = { ...inMemoryStore.users[index], ...req.body };
    return res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح', data: inMemoryStore.users[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * حذف مستخدم
 * DELETE /api/users/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isPostgresConnected) {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    }

    inMemoryStore.users = inMemoryStore.users.filter(u => u.id !== id);
    return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
