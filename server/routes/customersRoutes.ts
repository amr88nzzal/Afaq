/**
 * ============================================================================
 * مسارات إدارة الطلاب والعملاء (Customers & Students API)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   - كل المسارات محصورة بالموظفين (كانت مفتوحة تماماً للعامة).
 *   - لم يعد يُستخدم SELECT * — لأنها كانت تُعيد password_hash نصاً صريحاً
 *     لكل طالب مع كل طلب. الأعمدة محدّدة صراحةً الآن.
 *   - كلمات المرور تُشفَّر قبل الحفظ، ولا توجد قيمة افتراضية ثابتة.
 *   - الكتابة المباشرة لـ req.body عبر spread أُزيلت (Mass Assignment).
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { hashPassword, generateStrongPassword } from '../services/passwordService';
import { destroySessionsForApplication } from '../services/sessionService';
import { requireStaff } from '../middleware/auth';
import { failInternal } from '../middleware/security';

const router = Router();

/** الأعمدة الآمنة — لا تتضمّن password_hash */
const SAFE_CUSTOMER_COLUMNS = 'id, name, email, phone, whatsapp, nationality, current_status, created_at';

/** شكل العميل الآمن المُعاد للعميل */
function toSafeCustomer(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    nationality: row.nationality ?? null,
    current_status: row.current_status ?? null,
    created_at: row.created_at,
    applications_count: row.applications_count !== undefined ? Number(row.applications_count) : undefined,
  };
}

/**
 * جلب جميع الطلاب المسجلين — للموظفين فقط
 * GET /api/customers
 */
router.get('/', requireStaff(), async (_req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT c.id, c.name, c.email, c.phone, c.whatsapp, c.nationality,
               c.current_status, c.created_at,
               COUNT(a.id) as applications_count
        FROM customers c
        LEFT JOIN applications a ON a.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      return res.json({ success: true, source: 'postgres', data: result.rows.map(toSafeCustomer) });
    }
    return res.json({
      success: true,
      source: 'in-memory',
      data: (inMemoryStore.customers as any[]).map((c) => toSafeCustomer({ ...c, applications_count: 0 })),
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * جلب تفاصيل طالب مع طلباته — للموظفين فقط
 * GET /api/customers/:id
 */
router.get('/:id', requireStaff(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'معرّف الطالب غير صالح' });
    }

    if (isPostgresConnected) {
      const custRes = await pool.query(
        `SELECT ${SAFE_CUSTOMER_COLUMNS} FROM customers WHERE id = $1`,
        [id]
      );
      if (custRes.rows.length === 0) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

      const appsRes = await pool.query(
        `SELECT a.id, a.application_number, a.status, a.study_level, a.intake_season,
                a.sponsor_type, a.gpa, a.staff_id, a.created_at, a.updated_at,
                u.name_ar as university_name_ar, m.name_ar as major_name_ar
         FROM applications a
         LEFT JOIN universities u ON a.university_id = u.id
         LEFT JOIN majors m ON a.major_id = m.id
         WHERE a.customer_id = $1`,
        [id]
      );

      return res.json({ success: true, data: { ...toSafeCustomer(custRes.rows[0]), applications: appsRes.rows } });
    }

    const cust = (inMemoryStore.customers as any[]).find((c) => c.id === id);
    if (!cust) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
    const apps = inMemoryStore.applications.filter((a) => a.customer_id === id);

    return res.json({ success: true, data: { ...toSafeCustomer(cust), applications: apps } });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * إضافة طالب جديد — للموظفين فقط
 * POST /api/customers
 */
router.post('/', requireStaff(), async (req: Request, res: Response) => {
  try {
    const { name, email, phone, whatsapp, password, nationality } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'الاسم والبريد حقول مطلوبة' });
    }

    const passwordProvided = typeof password === 'string' && password.length > 0;
    if (passwordProvided && password.length < 8) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }
    // لا قيمة افتراضية ثابتة (كانت 123456)
    const rawPassword = passwordProvided ? password : generateStrongPassword(12);
    const passwordHash = await hashPassword(rawPassword);

    if (isPostgresConnected) {
      // لا نستبدل بيانات عميل قائم — نُبلّغ بالتعارض بدل الكتابة فوق سجل شخص آخر
      const existing = await pool.query('SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'يوجد طالب مسجل بهذا البريد الإلكتروني بالفعل' });
      }

      const result = await pool.query(
        `INSERT INTO customers (name, email, phone, whatsapp, password_hash, nationality, current_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         RETURNING ${SAFE_CUSTOMER_COLUMNS}`,
        [name, email, phone, whatsapp || phone, passwordHash, nationality || 'Saudi']
      );
      return res.status(201).json({
        success: true,
        message: 'تم تسجيل الطالب بنجاح',
        data: toSafeCustomer(result.rows[0]),
        ...(passwordProvided ? {} : { generatedPassword: rawPassword }),
      });
    }

    const newCust = {
      id: Date.now(),
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      password_hash: passwordHash,
      nationality: nationality || 'Saudi',
      current_status: 'active',
      created_at: new Date().toISOString(),
    };
    (inMemoryStore.customers as any[]).push(newCust);
    saveStoreToDisk();
    return res.status(201).json({
      success: true,
      message: 'تم تسجيل الطالب بنجاح',
      data: toSafeCustomer(newCust),
      ...(passwordProvided ? {} : { generatedPassword: rawPassword }),
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * تعديل بيانات طالب — للموظفين فقط
 * PUT /api/customers/:id
 */
router.put('/:id', requireStaff(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'معرّف الطالب غير صالح' });
    }

    const { name, email, phone, whatsapp, password, nationality, current_status } = req.body || {};

    const passwordProvided = typeof password === 'string' && password.length > 0;
    if (passwordProvided && password.length < 8) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }
    const newPasswordHash = passwordProvided ? await hashPassword(password) : null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE customers SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           whatsapp = COALESCE($4, whatsapp),
           password_hash = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE password_hash END,
           nationality = COALESCE($6, nationality),
           current_status = COALESCE($7, current_status)
         WHERE id = $8
         RETURNING ${SAFE_CUSTOMER_COLUMNS}`,
        [name, email, phone, whatsapp, newPasswordHash, nationality, current_status, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

      // تغيير كلمة مرور الطالب يُبطل جلساته القائمة على بوابته
      if (newPasswordHash) {
        const apps = await pool.query('SELECT id FROM applications WHERE customer_id = $1', [id]);
        for (const row of apps.rows) {
          destroySessionsForApplication(row.id);
        }
      }

      return res.json({ success: true, message: 'تم تعديل بيانات الطالب بنجاح', data: toSafeCustomer(result.rows[0]) });
    }

    const list = inMemoryStore.customers as any[];
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

    // تحديث حقول محدّدة فقط — لا spread لـ req.body
    const target = list[index];
    if (name !== undefined) target.name = name;
    if (email !== undefined) target.email = email;
    if (phone !== undefined) target.phone = phone;
    if (whatsapp !== undefined) target.whatsapp = whatsapp;
    if (nationality !== undefined) target.nationality = nationality;
    if (current_status !== undefined) target.current_status = current_status;
    if (newPasswordHash) {
      target.password_hash = newPasswordHash;
      for (const app of inMemoryStore.applications.filter((a) => a.customer_id === id)) {
        destroySessionsForApplication(app.id);
      }
    }
    saveStoreToDisk();
    return res.json({ success: true, message: 'تم تعديل بيانات الطالب بنجاح', data: toSafeCustomer(target) });
  } catch (error) {
    return failInternal(res, error);
  }
});

export default router;
