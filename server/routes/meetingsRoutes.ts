/**
 * ============================================================================
 * مسارات المواعيد والاستشارات الأكاديمية (Consultation Meetings API)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   - GET كان مفتوحاً ويعيد كل المواعيد مع أرقام هواتف الطلاب والمستشارين.
 *     الآن محصور بالموظفين.
 *   - POST (نموذج حجز عام) كان يُنشئ حساب عميل بكلمة مرور نصاً صريحاً '123456'
 *     ويستبدل هاتف عميل قائم عند تطابق البريد. أُصلح الاثنان.
 *   - PUT كان يستقبل req.body كاملاً (Mass Assignment). الآن حقول محدّدة.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { hashPassword, generateStrongPassword } from '../services/passwordService';
import { requireStaff } from '../middleware/auth';
import { rateLimit, failInternal } from '../middleware/security';

const router = Router();

/**
 * جلب جميع مواعيد الاستشارات — للموظفين فقط
 * GET /api/meetings
 */
router.get('/', requireStaff(), async (_req: Request, res: Response) => {
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
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * حجز موعد استشارة أكاديمية جديد — مسار عام (نموذج الموقع) ومحدود المعدّل
 * POST /api/meetings
 */
router.post(
  '/',
  rateLimit({
    name: 'public-meeting',
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'تم استلام عدد كبير من طلبات الحجز من هذا الجهاز. حاول لاحقاً.',
  }),
  async (req: Request, res: Response) => {
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

    const meetingLink = `https://meet.google.com/afq-${crypto.randomBytes(4).toString('hex')}`;

    if (isPostgresConnected) {
      // 1. إيجاد العميل إن وُجد، وإلا إنشاؤه بكلمة مرور مُشفّرة عشوائية.
      //    (كان السابق يُنشئ الحساب بكلمة '123456' نصاً صريحاً، ويستبدل
      //     هاتف عميل قائم عند تطابق البريد.)
      const existing = await pool.query(
        'SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [customer_email]
      );

      let customerId: number;
      if (existing.rows.length > 0) {
        customerId = existing.rows[0].id;
      } else {
        const newHash = await hashPassword(generateStrongPassword(12));
        const created = await pool.query(
          `INSERT INTO customers (name, email, phone, whatsapp, password_hash, current_status)
           VALUES ($1, $2, $3, $3, $4, 'active')
           RETURNING id`,
          [customer_name, customer_email, customer_phone, newHash]
        );
        customerId = created.rows[0].id;
      }

      // 2. إسناد مستشار متاح تلقائياً
      const staffRes = await pool.query("SELECT id FROM users WHERE role IN ('counselor', 'admin') LIMIT 1");
      const staffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;

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
      meeting_link: meetingLink,
      notes,
    };
    inMemoryStore.meetings.unshift(newMeeting as any);

    return res.status(201).json({
      success: true,
      message: 'تم حجز موعد الاستشارة بنجاح',
      data: newMeeting,
    });
  } catch (error) {
    return failInternal(res, error);
  }
  }
);

/**
 * تحديث حالة الموعد أو إضافة الرابط — للموظفين فقط
 * PUT /api/meetings/:id
 */
router.put('/:id', requireStaff(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'معرّف الموعد غير صالح' });
    }
    const { status, meeting_link, notes, staff_id } = req.body || {};

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

    const list = inMemoryStore.meetings as any[];
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'الموعد غير موجود' });

    const target = list[index];
    if (status !== undefined) target.status = status;
    if (meeting_link !== undefined) target.meeting_link = meeting_link;
    if (notes !== undefined) target.notes = notes;
    if (staff_id !== undefined) target.staff_id = staff_id;

    return res.json({ success: true, message: 'تم تحديث الموعد بنجاح', data: target });
  } catch (error) {
    return failInternal(res, error);
  }
});

export default router;
