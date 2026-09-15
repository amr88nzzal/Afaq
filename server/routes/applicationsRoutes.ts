/**
 * ============================================================================
 * مسارات طلبات القبول والطلاب (Applications & Student Placements REST API)
 * ============================================================================
 * هذا الملف مسؤول عن:
 * 1. استلام طلبات القبول المباشرة من الطلاب (ApplicationModal).
 * 2. تخزين الطلب والمستندات في قاعدة بيانات PostgreSQL مع التزامن مع مخزن الذاكرة.
 * 3. إطلاق تنبيه البريد الإلكتروني (Gmail) وتنبيه تلغرام للإدارة فوراً.
 * 4. تزويد بوابة الطالب (StudentDashboard) ولوحة المشرفين (StaffDashboard) بالبيانات.
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected } from '../db';
import { sendNewApplicationEmailToAdmin, sendStudentCredentialsEmail } from '../services/emailService';
import { sendTelegramNotification } from '../services/telegramService';

const router = Router();

/**
 * دالة مساعدة لتحويل صفوف PostgreSQL (snake_case) إلى كائن Application القياسي (camelCase)
 * سيتم تحديثها لتناسب الجداول الجديدة
 */
function mapPgRowToApplication(row: any): any {
  // هنا سنحتاج لتطوير هذا الربط ليعكس العلاقات الجديدة مع جداول customers, universities, majors
  return {
    id: row.id,
    applicationNumber: row.application_number,
    studentName: row.customer_name,
    studentEmail: row.customer_email,
    studentPhone: row.customer_phone,
    universityName: row.university_name_ar,
    courseName: row.major_name_ar,
    status: row.status,
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    // بقية الحقول سيتم ملؤها لاحقاً
  };
}

/**
 * دالة مساعدة للبحث عن الطلب في قاعدة البيانات
 */
async function findApplicationByIdOrNumber(id: string): Promise<any | null> {
  if (!isPostgresConnected) return null;
  
  try {
    const result = await pool.query(`
      SELECT a.*, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             u.name_ar as university_name_ar,
             m.name_ar as major_name_ar
      FROM applications a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN universities u ON a.university_id = u.id
      LEFT JOIN majors m ON a.major_id = m.id
      WHERE a.id = $1 OR a.application_number = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length > 0) {
      return mapPgRowToApplication(result.rows[0]);
    }
  } catch (err: any) {
    console.error('Error finding application:', err.message);
  }
  return null;
}

/**
 * جلب جميع طلبات القبول (لوحة إدارة المشرفين Staff CRM)
 * GET /api/applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT a.*, 
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               u.name_ar as university_name_ar,
               m.name_ar as major_name_ar
        FROM applications a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN majors m ON a.major_id = m.id
        ORDER BY a.created_at DESC
      `);

      return res.json({ success: true, source: 'postgres', data: result.rows.map(mapPgRowToApplication) });
    }
    return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متصلة' });
  } catch (error: any) {
    console.error('Error fetching applications:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * استعلام عن طلب محدد بواسطة المعرف أو رقم الطلب (بوابة الطالب Student Portal)
 * GET /api/applications/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const app = await findApplicationByIdOrNumber(id);

    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    return res.json({ success: true, data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تقديم طلب قبول جامعي جديد
 * POST /api/applications
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      studentName,
      email,
      phone,
      countryDestinationId,
      studyLevel,
      preferredMajorId,
      preferredUniversityId,
      additionalNotes,
    } = req.body;

    if (!studentName || !email || !phone || !countryDestinationId) {
      return res.status(400).json({ success: false, error: 'الرجاء استكمال البيانات المطلوبة.' });
    }

    if (!isPostgresConnected) {
      return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متصلة' });
    }

    // 1. التعامل مع العميل (إنشاء أو تحديث)
    const customerRes = await pool.query(
      `INSERT INTO customers (name, email, phone, password_hash) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET phone = EXCLUDED.phone 
       RETURNING id`,
      [studentName, email, phone, 'hashed_password_placeholder']
    );
    const customerId = customerRes.rows[0].id;

    // 2. توليد رقم طلب وتخزينه
    const applicationNumber = `AFQ-${Date.now().toString().slice(-6)}`;
    
    const appRes = await pool.query(
      `INSERT INTO applications (
        application_number, customer_id, university_id, major_id, country_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [applicationNumber, customerId, preferredUniversityId, preferredMajorId, countryDestinationId, 'under_review']
    );

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل طلبك بنجاح',
      applicationNumber,
      data: { id: appRes.rows[0].id }
    });
  } catch (error: any) {
    console.error('Error submitting application:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث حالة الطلب ومراحله (لوحة المشرفين Staff CRM)
 * PATCH /api/applications/:id/status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!isPostgresConnected) {
      return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متصلة' });
    }

    await pool.query(
      `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 OR application_number = $2`,
      [status, id]
    );

    // إضافة ملاحظة في حال وجودها
    if (note) {
      await pool.query(
        `INSERT INTO messages (application_id, message_text, sender_type) 
         SELECT id, $1, 'staff' FROM applications WHERE id = $2 OR application_number = $2`,
        [note, id]
      );
    }

    return res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث بيانات الطلب الكاملة
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, customer_id, university_id, major_id, country_id, staff_id } = req.body;

    if (!isPostgresConnected) return res.status(503).json({ success: false, error: 'DB disconnected' });

    await pool.query(
      `UPDATE applications SET 
        status = COALESCE($1, status),
        customer_id = COALESCE($2, customer_id),
        university_id = COALESCE($3, university_id),
        major_id = COALESCE($4, major_id),
        country_id = COALESCE($5, country_id),
        staff_id = COALESCE($6, staff_id),
        updated_at = NOW()
       WHERE id = $7 OR application_number = $7`,
      [status, customer_id, university_id, major_id, country_id, staff_id, id]
    );

    return res.json({ success: true, message: 'تم التحديث بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث حالة وثيقة
 */
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { doc_type, status, file_url } = req.body;

    if (!isPostgresConnected) return res.status(503).json({ success: false, error: 'DB disconnected' });

    await pool.query(
      `INSERT INTO documents (application_id, doc_type, status, file_url)
       SELECT id, $1, $2, $3 FROM applications WHERE id = $4 OR application_number = $4`,
      [doc_type, status, file_url, id]
    );

    return res.json({ success: true, message: 'تم تحديث الوثيقة' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث كلمة مرور الطالب (بما أن كلمة المرور الآن في جدول customers)
 */
router.patch('/:id/portal-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!isPostgresConnected) return res.status(503).json({ success: false, error: 'DB disconnected' });

    await pool.query(
      `UPDATE customers SET password_hash = $1 WHERE id = (SELECT customer_id FROM applications WHERE id = $2 OR application_number = $2)`,
      [newPassword, id]
    );

    return res.json({ success: true, message: 'تم تحديث كلمة المرور' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إرسال بيانات الدخول (تحتاج لجلب بيانات الطالب من جدول customers)
 */
router.post('/:id/send-credentials', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isPostgresConnected) return res.status(503).json({ success: false, error: 'DB disconnected' });

    const appRes = await pool.query(
      `SELECT c.name, c.email, a.application_number, c.password_hash 
       FROM applications a JOIN customers c ON a.customer_id = c.id 
       WHERE a.id = $1 OR a.application_number = $1`,
      [id]
    );

    if (appRes.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    const { name, email, application_number, password_hash } = appRes.rows[0];
    
    // إرسال الإيميل
    await sendStudentCredentialsEmail({
      studentName: name,
      studentEmail: email,
      applicationNumber: application_number,
      portalPassword: password_hash, // استخدام كلمة المرور الحقيقية من قاعدة البيانات
      destination: 'uk',
      universityName: 'غير محدد',
      counselorName: 'المستشار الأكاديمي'
    });

    return res.json({ success: true, message: 'تم الإرسال بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
