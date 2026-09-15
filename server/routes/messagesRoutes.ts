/**
 * ============================================================================
 * مسارات الرسائل والملاحظات على الطلبات (Messages & Notes API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع الرسائل والملاحظات المرتبطة بطلب معين
 * GET /api/messages?application_id=1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { application_id } = req.query;
    if (!application_id) {
      return res.status(400).json({ success: false, error: 'application_id مطلوب' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT * FROM messages WHERE application_id = $1 ORDER BY sent_at ASC',
        [application_id]
      );
      return res.json({ success: true, data: result.rows });
    }

    const app = inMemoryStore.applications.find(
      a => a.id === parseInt(application_id as string, 10) || a.application_number === application_id
    );
    return res.json({ success: true, data: app?.messages || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إرسال رسالة جديدة أو إضافة ملاحظة داخلية
 * POST /api/messages
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { application_id, sender_id, sender_type, sender_name, message_text, is_internal_note } = req.body;

    if (!application_id || !message_text) {
      return res.status(400).json({ success: false, error: 'بيانات الرسالة غير مكتملة' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO messages (application_id, sender_id, sender_type, sender_name, message_text, is_internal_note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [application_id, sender_id || null, sender_type || 'user', sender_name || 'المستشار الأكاديمي', message_text, is_internal_note ?? false]
      );
      return res.status(201).json({ success: true, message: 'تم إرسال الرسالة بنجاح', data: result.rows[0] });
    }

    const newMsg = {
      id: Date.now(),
      application_id: parseInt(application_id, 10),
      sender_id: sender_id || null,
      sender_type: sender_type || 'user',
      sender_name: sender_name || 'المستشار الأكاديمي',
      message_text,
      is_internal_note: is_internal_note ?? false,
      sent_at: new Date().toISOString(),
    };

    const appIndex = inMemoryStore.applications.findIndex(a => a.id === parseInt(application_id, 10));
    if (appIndex >= 0) {
      if (!inMemoryStore.applications[appIndex].messages) {
        inMemoryStore.applications[appIndex].messages = [];
      }
      inMemoryStore.applications[appIndex].messages.push(newMsg);
    }

    return res.status(201).json({ success: true, message: 'تم إرسال الرسالة بنجاح', data: newMsg });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
