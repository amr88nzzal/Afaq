/**
 * ============================================================================
 * مسارات المواعيد والاستشارات الأكاديمية (Consultation Meetings API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع مواعيد الاستشارات
 * GET /api/meetings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT m.*, 
               u.name as counselor_name, u.phone as counselor_phone
        FROM meetings m
        LEFT JOIN users u ON m.staff_id = u.id
        ORDER BY m.meeting_date ASC, m.meeting_time ASC
      `);
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.meetings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * حجز موعد استشارة أكاديمية جديد
 * POST /api/meetings
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      destination_country,
      meeting_date,
      meeting_time,
      meeting_type,
      notes,
    } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !meeting_date || !meeting_time) {
      return res.status(400).json({ success: false, error: 'الرجاء استكمال جميع بيانات الموعد' });
    }

    if (isPostgresConnected) {
      // 1. تسجيل أو إيجاد العميل
      const custRes = await pool.query(
        `INSERT INTO customers (name, email, phone, password_hash)
         VALUES ($1, $2, $3, '123456')
         ON CONFLICT (email) DO UPDATE SET phone = EXCLUDED.phone
         RETURNING id`,
        [customer_name, customer_email, customer_phone]
      );
      const customerId = custRes.rows[0].id;

      // 2. إسناد مستشار متاح تلقائياً
      const staffRes = await pool.query("SELECT id FROM users WHERE role = 'counselor' OR role = 'admin' LIMIT 1");
      const staffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;

      const meetingLink = `https://meet.google.com/afq-${Math.random().toString(36).substring(2, 7)}`;

      const result = await pool.query(
        `INSERT INTO meetings (
          customer_id, staff_id, customer_name, customer_email, customer_phone,
          destination_country, meeting_date, meeting_time, meeting_type, status, meeting_link, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10, $11)
        RETURNING *`,
        [
          customerId, staffId, customer_name, customer_email, customer_phone,
          destination_country, meeting_date, meeting_time, meeting_type || 'video', meetingLink, notes
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'تم حجز موعد الاستشارة بنجاح، سيصلك رابط الجلسة عبر البريد والواتساب',
        data: result.rows[0],
      });
    }

    const newMeeting = {
      id: Date.now(),
      customer_id: 1,
      staff_id: 1,
      customer_name,
      customer_email,
      customer_phone,
      destination_country,
      meeting_date,
      meeting_time,
      meeting_type: meeting_type || 'video',
      status: 'scheduled',
      meeting_link: `https://meet.google.com/afq-${Math.random().toString(36).substring(2, 7)}`,
      notes,
    };
    inMemoryStore.meetings.unshift(newMeeting);

    return res.status(201).json({
      success: true,
      message: 'تم حجز موعد الاستشارة بنجاح',
      data: newMeeting,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث حالة الموعد أو إضافة الرابط
 * PUT /api/meetings/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, meeting_link, notes, staff_id } = req.body;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE meetings SET
           status = COALESCE($1, status),
           meeting_link = COALESCE($2, meeting_link),
           notes = COALESCE($3, notes),
           staff_id = COALESCE($4, staff_id)
         WHERE id = $5
         RETURNING *`,
        [status, meeting_link, notes, staff_id, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الموعد غير موجود' });
      return res.json({ success: true, message: 'تم تحديث الموعد بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.meetings.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'الموعد غير موجود' });
    inMemoryStore.meetings[index] = { ...inMemoryStore.meetings[index], ...req.body };
    return res.json({ success: true, message: 'تم تحديث الموعد بنجاح', data: inMemoryStore.meetings[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
