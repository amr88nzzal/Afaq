/**
 * ============================================================================
 * مسارات الرسائل والملاحظات على الطلبات (Messages & Notes API)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   - GET كان مفتوحاً تماماً (IDOR): أي شخص يقرأ محادثات أي طالب
 *     بما فيها الملاحظات الداخلية للموظفين. الآن يحتاج جلسة + ملكية.
 *   - الملاحظات الداخلية (is_internal_note) لا تُعاد للطالب إطلاقاً.
 *   - POST كان يستقبل sender_id/sender_name/sender_type من العميل،
 *     ما سمح بانتحال هوية أي مستشار. الآن تُشتقّ من الجلسة.
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { requireAuth, isStaff } from '../middleware/auth';
import { failInternal } from '../middleware/security';

const router = Router();

/** تحويل معرّف الطلب (رقم أو رقم طلب) إلى المعرّف الرقمي */
async function resolveApplicationId(idOrNumber: string): Promise<number | null> {
  const parsed = parseInt(idOrNumber, 10);
  if (isPostgresConnected) {
    const appRes = await pool.query(
      'SELECT id FROM applications WHERE application_number = $1 OR id::text = $1 LIMIT 1',
      [idOrNumber]
    );
    if (appRes.rows.length > 0) return appRes.rows[0].id;
    return Number.isNaN(parsed) ? null : null;
  }
  const app = inMemoryStore.applications.find(
    (a) => a.id.toString() === idOrNumber || a.application_number === idOrNumber
  );
  return app ? app.id : null;
}

/**
 * جلب الرسائل المرتبطة بطلب معين — يحتاج جلسة وملكية
 * GET /api/messages?application_id=1
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { application_id } = req.query;
    if (!application_id) {
      return res.status(400).json({ success: false, error: 'application_id مطلوب' });
    }

    const appIdStr = String(application_id);
    const targetId = await resolveApplicationId(appIdStr);
    if (targetId === null) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const staff = isStaff(req);
    // الطالب لا يصل إلا لطلبه
    if (!staff && req.auth?.applicationId !== targetId) {
      return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى هذه المحادثة' });
    }

    if (isPostgresConnected) {
      const result = staff
        ? await pool.query('SELECT * FROM messages WHERE application_id = $1 ORDER BY sent_at ASC', [targetId])
        : await pool.query(
            'SELECT * FROM messages WHERE application_id = $1 AND COALESCE(is_internal_note, false) = false ORDER BY sent_at ASC',
            [targetId]
          );
      return res.json({ success: true, data: result.rows });
    }

    const app = inMemoryStore.applications.find((a) => a.id === targetId);
    const messages = (app?.messages || []) as any[];
    return res.json({
      success: true,
      data: staff ? messages : messages.filter((m) => !m.is_internal_note),
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * إرسال رسالة أو ملاحظة داخلية — يحتاج جلسة وملكية
 * POST /api/messages
 * هوية المُرسِل تُشتقّ من الجلسة ولا تُقبل من جسم الطلب.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { application_id, message_text, is_internal_note } = req.body || {};

    if (!application_id || !message_text || !String(message_text).trim()) {
      return res.status(400).json({ success: false, error: 'بيانات الرسالة غير مكتملة' });
    }

    const appIdStr = String(application_id);
    const targetId = await resolveApplicationId(appIdStr);
    if (targetId === null) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const staff = isStaff(req);
    if (!staff && req.auth?.applicationId !== targetId) {
      return res.status(403).json({ success: false, error: 'غير مصرح بالكتابة في هذه المحادثة' });
    }

    // الملاحظات الداخلية للموظفين فقط
    const internalNote = staff ? is_internal_note === true : false;

    const auth = req.auth!;
    const senderType = staff ? 'user' : 'student';
    const senderName = auth.name || (staff ? 'مستشار القبول' : 'الطالب');
    const senderId = staff ? (auth.userId ?? null) : null;
    const text = String(message_text).slice(0, 5000);

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO messages (application_id, sender_id, sender_type, sender_name, message_text, is_internal_note, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [targetId, senderId, senderType, senderName, text, internalNote]
      );
      return res.status(201).json({ success: true, message: 'تم إرسال الرسالة بنجاح', data: result.rows[0] });
    }

    const appIndex = inMemoryStore.applications.findIndex((a) => a.id === targetId);
    const newMsg = {
      id: Date.now(),
      application_id: targetId,
      sender_id: senderId,
      sender_type: senderType,
      sender_name: senderName,
      message_text: text,
      is_internal_note: internalNote,
      sent_at: new Date().toISOString(),
    };

    if (appIndex >= 0) {
      if (!inMemoryStore.applications[appIndex].messages) {
        inMemoryStore.applications[appIndex].messages = [];
      }
      inMemoryStore.applications[appIndex].messages.push(newMsg as any);
      saveStoreToDisk();
    }

    return res.status(201).json({ success: true, message: 'تم إرسال الرسالة بنجاح', data: newMsg });
  } catch (error) {
    return failInternal(res, error);
  }
});

export default router;
