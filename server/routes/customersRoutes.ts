/**
 * ============================================================================
 * مسارات إدارة الطلاب والعملاء (Customers & Students API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع الطلاب المسجلين
 * GET /api/customers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT c.*, 
               COUNT(a.id) as applications_count
        FROM customers c
        LEFT JOIN applications a ON a.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.customers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * جلب تفاصيل طالب مع طلباته
 * GET /api/customers/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isPostgresConnected) {
      const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      if (custRes.rows.length === 0) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

      const appsRes = await pool.query(`
        SELECT a.*, u.name_ar as university_name_ar, m.name_ar as major_name_ar
        FROM applications a
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN majors m ON a.major_id = m.id
        WHERE a.customer_id = $1
      `, [id]);

      return res.json({ success: true, data: { ...custRes.rows[0], applications: appsRes.rows } });
    }

    const cust = inMemoryStore.customers.find(c => c.id === id);
    if (!cust) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
    const apps = inMemoryStore.applications.filter(a => a.customer_id === id);

    return res.json({ success: true, data: { ...cust, applications: apps } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إضافة طالب جديد
 * POST /api/customers
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, whatsapp, password, nationality } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'الاسم والبريد حقول مطلوبة' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO customers (name, email, phone, whatsapp, password_hash, nationality, current_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (email) DO UPDATE SET 
           name = EXCLUDED.name,
           phone = COALESCE(EXCLUDED.phone, customers.phone),
           whatsapp = COALESCE(EXCLUDED.whatsapp, customers.whatsapp)
         RETURNING *`,
        [name, email, phone, whatsapp || phone, password || '123456', nationality || 'Saudi']
      );
      return res.status(201).json({ success: true, message: 'تم تسجيل الطالب بنجاح', data: result.rows[0] });
    }

    const newCust = {
      id: Date.now(),
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      password_hash: password || '123456',
      nationality: nationality || 'Saudi',
      current_status: 'active',
    };
    inMemoryStore.customers.push(newCust);
    return res.status(201).json({ success: true, message: 'تم تسجيل الطالب بنجاح', data: newCust });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تعديل بيانات طالب
 * PUT /api/customers/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, email, phone, whatsapp, password, nationality, current_status } = req.body;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE customers SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           whatsapp = COALESCE($4, whatsapp),
           password_hash = CASE WHEN $5::text IS NOT NULL AND $5 <> '' THEN $5 ELSE password_hash END,
           nationality = COALESCE($6, nationality),
           current_status = COALESCE($7, current_status)
         WHERE id = $8
         RETURNING *`,
        [name, email, phone, whatsapp, password, nationality, current_status, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
      return res.json({ success: true, message: 'تم تعديل بيانات الطالب بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.customers.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
    inMemoryStore.customers[index] = { ...inMemoryStore.customers[index], ...req.body };
    return res.json({ success: true, message: 'تم تعديل بيانات الطالب بنجاح', data: inMemoryStore.customers[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
