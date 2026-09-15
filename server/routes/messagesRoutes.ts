/**
 * ============================================================================
 * مسارات الرسائل والملاحظات على الطلبات (Messages & Notes API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';

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

    const appIdStr = String(application_id);

    if (isPostgresConnected) {
      let targetNumericId = parseInt(appIdStr, 10);
      if (isNaN(targetNumericId)) {
        const appRes = await pool.query('SELECT id FROM applications WHERE application_number = $1 OR id::text = $1', [appIdStr]);
        if (appRes.rows.length > 0) {
          targetNumericId = appRes.rows[0].id;
        }
      }

      const result = await pool.query(
        'SELECT * FROM messages WHERE application_id = $1 OR application_id::text = $2 ORDER BY sent_at ASC',
        [isNaN(targetNumericId) ? 0 : targetNumericId, appIdStr]
      );
      return res.json({ success: true, data: result.rows });
    }

    const app = inMemoryStore.applications.find(
      a => a.id.toString() === appIdStr || a.application_number === appIdStr
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

    const appIdStr = String(application_id);

    if (isPostgresConnected) {
      let targetNumericId = parseInt(appIdStr, 10);
      if (isNaN(targetNumericId)) {
        const appRes = await pool.query('SELECT id FROM applications WHERE application_number = $1 OR id::text = $1', [appIdStr]);
        if (appRes.rows.length > 0) {
          targetNumericId = appRes.rows[0].id;
        }
      }

      const result = await pool.query(
        `INSERT INTO messages (application_id, sender_id, sender_type, sender_name, message_text, is_internal_note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [isNaN(targetNumericId) ? 1 : targetNumericId, sender_id || null, sender_type || 'user', sender_name || 'المستشار الأكاديمي', message_text, is_internal_note ?? false]
      );
      return res.status(201).json({ success: true, message: 'تم إرسال الرسالة بنجاح', data: result.rows[0] });
    }

    const appIndex = inMemoryStore.applications.findIndex(
      a => a.id.toString() === appIdStr || a.application_number === appIdStr
    );

    const targetAppId = appIndex >= 0 ? inMemoryStore.applications[appIndex].id : (parseInt(appIdStr, 10) || 1);

    const newMsg = {
      id: Date.now(),
      application_id: targetAppId,
      sender_id: sender_id || null,
      sender_type: sender_type || 'user',
      sender_name: sender_name || (sender_type === 'student' ? 'الطالب' : 'المستشار الأكاديمي'),
      message_text,
      is_internal_note: is_internal_note ?? false,
      sent_at: new Date().toISOString(),
    };

    if (appIndex >= 0) {
      if (!inMemoryStore.applications[appIndex].messages) {
        inMemoryStore.applications[appIndex].messages = [];
      }
      inMemoryStore.applications[appIndex].messages.push(newMsg);
      saveStoreToDisk();
    }

    return res.status(201).json({ success: true, message: 'تم إرسال الرسالة بنجاح', data: newMsg });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
