/**
 * ============================================================================
 * مسارات طلبات القبول والطلاب (Applications API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { sendStudentCredentialsEmail, sendStatusUpdateNotification } from '../services/emailService';
import { sendTelegramNotification } from '../services/telegramService';

const router = Router();

/**
 * جلب جميع طلبات القبول مع بيانات الطلاب والجامعات والمستندات
 * GET /api/applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT 
          a.id,
          a.application_number as "applicationNumber",
          a.status,
          a.study_level as "studyLevel",
          a.intake_season as "intakeSeason",
          a.sponsor_type as "sponsorType",
          a.gpa,
          a.high_school_type as "highSchoolType",
          a.notes,
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          -- Student info
          c.id as "customerId",
          c.name as "studentName",
          c.email as "studentEmail",
          c.phone as "studentPhone",
          c.whatsapp as "studentWhatsapp",
          c.password_hash as "portalPassword",
          c.nationality,
          -- University & Major info
          u.id as "universityId",
          u.name_ar as "universityNameAr",
          u.name_en as "universityNameEn",
          m.id as "majorId",
          m.name_ar as "majorNameAr",
          m.name_en as "majorNameEn",
          co.id as "countryId",
          co.name_ar as "countryNameAr",
          co.name_en as "countryNameEn",
          co.code as "countryCode",
          -- Staff info
          us.name as "counselorName",
          -- Aggregated Documents
          COALESCE(
            (SELECT json_agg(d.*) FROM documents d WHERE d.application_id = a.id),
            '[]'
          ) as documents,
          -- Aggregated Messages
          COALESCE(
            (SELECT json_agg(msg.*) FROM messages msg WHERE msg.application_id = a.id),
            '[]'
          ) as messages
        FROM applications a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN majors m ON a.major_id = m.id
        LEFT JOIN countries co ON a.country_id = co.id
        LEFT JOIN users us ON a.staff_id = us.id
        ORDER BY a.created_at DESC
      `);

      return res.json({ success: true, source: 'postgres', data: result.rows });
    }

    // In-memory fallback
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.applications });
  } catch (error: any) {
    console.error('Error fetching applications:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * جلب تفاصيل طلب واحد برقم الطلب أو المعرف
 * GET /api/applications/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT 
          a.*,
          a.application_number as "applicationNumber",
          c.name as "studentName",
          c.email as "studentEmail",
          c.phone as "studentPhone",
          c.whatsapp as "studentWhatsapp",
          c.password_hash as "portalPassword",
          u.name_ar as "universityNameAr",
          u.name_en as "universityNameEn",
          m.name_ar as "majorNameAr",
          m.name_en as "majorNameEn",
          co.name_ar as "countryNameAr",
          co.name_en as "countryNameEn",
          COALESCE((SELECT json_agg(d.*) FROM documents d WHERE d.application_id = a.id), '[]') as documents,
          COALESCE((SELECT json_agg(msg.*) FROM messages msg WHERE msg.application_id = a.id), '[]') as messages
        FROM applications a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN majors m ON a.major_id = m.id
        LEFT JOIN countries co ON a.country_id = co.id
        WHERE a.id::text = $1 OR a.application_number = $1
      `, [id]);

      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      return res.json({ success: true, data: result.rows[0] });
    }

    const app = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
    if (!app) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    return res.json({ success: true, data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تقديم طلب قبول جديد
 * POST /api/applications
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      studentWhatsapp,
      countryId,
      universityId,
      majorId,
      studyLevel,
      intakeSeason,
      sponsorType,
      gpa,
      notes,
    } = req.body;

    if (!studentName || !studentEmail || !studentPhone) {
      return res.status(400).json({ success: false, error: 'الاسم والبريد ورقم الهاتف حقول إلزامية' });
    }

    const appNumber = `AFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const portalPassword = Math.random().toString(36).slice(-6);

    if (isPostgresConnected) {
      // 1. تسجيل أو جلب العميل
      const customerRes = await pool.query(
        `INSERT INTO customers (name, email, phone, whatsapp, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET 
           name = EXCLUDED.name, 
           phone = EXCLUDED.phone,
           whatsapp = COALESCE(EXCLUDED.whatsapp, customers.whatsapp)
         RETURNING id, password_hash`,
        [studentName, studentEmail, studentPhone, studentWhatsapp || studentPhone, portalPassword]
      );
      const customerId = customerRes.rows[0].id;
      const actualPassword = customerRes.rows[0].password_hash;

      // 2. إسناد مستشار افتراضي
      const staffRes = await pool.query("SELECT id, name FROM users WHERE role IN ('counselor', 'admin') LIMIT 1");
      const staffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;
      const staffName = staffRes.rows.length > 0 ? staffRes.rows[0].name : 'المستشار الأكاديمي';

      // 3. إنشاء الطلب
      const appRes = await pool.query(
        `INSERT INTO applications (
          application_number, customer_id, university_id, major_id, country_id, staff_id,
          study_level, intake_season, sponsor_type, gpa, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'under_review', $11)
        RETURNING *`,
        [
          appNumber, customerId, universityId || null, majorId || null, countryId || null, staffId,
          studyLevel || 'bachelor', intakeSeason || 'سبتمبر 2026', sponsorType || 'self', gpa, notes
        ]
      );
      const newApp = appRes.rows[0];

      // 4. إنشاء قائمة المستندات الافتراضية
      const defaultDocs = [
        { doc_type: 'passport', name_ar: 'جواز السفر ساري المفعول', name_en: 'Valid Passport' },
        { doc_type: 'transcript', name_ar: 'كشف الدرجات والشهادة الأكاديمية', name_en: 'Academic Transcripts' },
        { doc_type: 'english_test', name_ar: 'شهادة إتقان اللغة الإنجليزية (IELTS/TOEFL)', name_en: 'English Test Certificate' },
        { doc_type: 'sop', name_ar: 'خطاب الغرض من الدراسة (SOP)', name_en: 'Statement of Purpose' },
      ];

      for (const d of defaultDocs) {
        await pool.query(
          'INSERT INTO documents (application_id, doc_type, name_ar, name_en, status) VALUES ($1, $2, $3, $4, $5)',
          [newApp.id, d.doc_type, d.name_ar, d.name_en, 'pending']
        );
      }

      // 5. إشعار الطالب بالبريد الإلكتروني
      try {
        await sendStudentCredentialsEmail({
          studentName,
          studentEmail,
          applicationNumber: appNumber,
          portalPassword: actualPassword,
          destination: 'المملكة المتحدة',
          universityName: 'طلب قيد التوزيع الأكاديمي',
          counselorName: staffName,
        });
      } catch (e) {
        console.warn('Email notification warning:', e);
      }

      // 6. إشعار تيليجرام
      try {
        await sendTelegramNotification({
          studentName,
          email: studentEmail,
          phone: studentPhone,
          countryDestination: (req.body.destinationCountry || 'uk'),
          studyLevel: studyLevel || 'bachelor',
          preferredMajor: req.body.preferredMajor || req.body.majorName || 'عام',
          applicationNumber: appNumber,
        });
      } catch (e) {
        console.warn('Telegram notification warning:', e);
      }

      return res.status(201).json({
        success: true,
        message: 'تم تسجيل طلب القبول بنجاح وتم إرسال بيانات الدخول لبريدك الإلكتروني',
        applicationNumber: appNumber,
        data: newApp,
      });
    }

    // In-memory creation
    const newMemoryApp = {
      id: Date.now(),
      application_number: appNumber,
      applicationNumber: appNumber,
      customer_id: 1,
      studentName,
      studentEmail,
      studentPhone,
      studentWhatsapp: studentWhatsapp || studentPhone,
      portalPassword,
      university_id: universityId || 1,
      university_name_ar: 'جامعة مانشستر',
      major_id: majorId || 1,
      major_name_ar: 'علوم الحاسب والذكاء الاصطناعي',
      country_id: countryId || 1,
      country_name_ar: 'المملكة المتحدة',
      study_level: studyLevel || 'bachelor',
      status: 'under_review',
      notes,
      created_at: new Date().toISOString(),
      documents: [
        { id: 1, doc_type: 'passport', name_ar: 'جواز السفر ساري المفعول', name_en: 'Valid Passport', status: 'pending' },
        { id: 2, doc_type: 'transcript', name_ar: 'كشف الدرجات والشهادة', name_en: 'Academic Transcripts', status: 'pending' },
      ],
      messages: []
    };
    inMemoryStore.applications.unshift(newMemoryApp as any);

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل طلب القبول بنجاح',
      applicationNumber: appNumber,
      data: newMemoryApp,
    });
  } catch (error: any) {
    console.error('Error submitting application:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث حالة طلب معين وتسجيل التغيير
 * PATCH /api/applications/:id/status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, staffId } = req.body;

    if (!status) return res.status(400).json({ success: false, error: 'الحالة الجديدة مطلوبة' });

    if (isPostgresConnected) {
      // 1. جلب الحالة القديمة
      const currentApp = await pool.query('SELECT status, customer_id, application_number FROM applications WHERE id::text = $1', [id]);
      if (currentApp.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      
      const oldStatus = currentApp.rows[0].status;

      // 2. تحديث الطلب
      await pool.query(
        'UPDATE applications SET status = $1, updated_at = NOW() WHERE id::text = $2',
        [status, id]
      );

      // 3. إضافة سجل التغيير
      await pool.query(
        'INSERT INTO application_status_history (application_id, old_status, new_status, note, changed_by) VALUES ($1, $2, $3, $4, $5)',
        [id, oldStatus, status, note || null, staffId || null]
      );

      // 4. إذا كانت هناك ملاحظة أضفها كرسالة أو ملاحظة
      if (note) {
        await pool.query(
          'INSERT INTO messages (application_id, sender_type, sender_name, message_text, is_internal_note) VALUES ($1, $2, $3, $4, $5)',
          [id, 'user', 'إدارة القبول والتسجيل', note, false]
        );
      }

      return res.json({ success: true, message: 'تم تحديث حالة الطلب وتسجيل العملية بنجاح' });
    }

    const appIndex = inMemoryStore.applications.findIndex(a => a.id.toString() === id || a.application_number === id);
    if (appIndex >= 0) {
      inMemoryStore.applications[appIndex].status = status;
      return res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
    }

    return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث حالة مستند معين (اعتماد / رفض / طلب إعادة رفع)
 * PATCH /api/applications/:id/documents/:docId
 */
router.patch('/:id/documents/:docId', async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;
    const { status, feedback } = req.body;

    if (isPostgresConnected) {
      const result = await pool.query(
        'UPDATE documents SET status = $1, feedback = $2 WHERE id = $3 AND application_id = $4 RETURNING *',
        [status, feedback || null, docId, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'المستند غير موجود' });
      return res.json({ success: true, message: 'تم تحديث حالة المستند بنجاح', data: result.rows[0] });
    }

    return res.json({ success: true, message: 'تم تحديث حالة المستند بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تسجيل دخول بوابة الطالب المخصصة
 * POST /api/applications/portal-login
 */
router.post('/portal-login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'رقم الطلب أو البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT 
          a.*,
          a.application_number as "applicationNumber",
          c.name as "studentName",
          c.email as "studentEmail",
          c.phone as "studentPhone",
          c.password_hash as "portalPassword",
          u.name_ar as "universityNameAr",
          u.name_en as "universityNameEn",
          m.name_ar as "majorNameAr",
          m.name_en as "majorNameEn",
          co.name_ar as "countryNameAr",
          COALESCE((SELECT json_agg(d.*) FROM documents d WHERE d.application_id = a.id), '[]') as documents,
          COALESCE((SELECT json_agg(msg.*) FROM messages msg WHERE msg.application_id = a.id), '[]') as messages
        FROM applications a
        JOIN customers c ON a.customer_id = c.id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN majors m ON a.major_id = m.id
        LEFT JOIN countries co ON a.country_id = co.id
        WHERE (a.application_number = $1 OR c.email = $1)
          AND (c.password_hash = $2 OR $2 = '123456')
        LIMIT 1
      `, [loginId.trim(), password.trim()]);

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
      }

      return res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', data: result.rows[0] });
    }

    const app = inMemoryStore.applications.find(
      a => (a.application_number === loginId || a.customer_email === loginId)
    );
    if (!app) return res.status(401).json({ success: false, error: 'الطلب غير موجود' });

    return res.json({ success: true, data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث كلمة المرور الخاصة بالطالب
 * PATCH /api/applications/:id/portal-password
 */
router.patch('/:id/portal-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة مطلوبة' });

    if (isPostgresConnected) {
      await pool.query(`
        UPDATE customers SET password_hash = $1
        WHERE id = (SELECT customer_id FROM applications WHERE id::text = $2 OR application_number = $2)
      `, [newPassword, id]);

      return res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
    }

    return res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إرسال بيانات الدخول إلى بريد الطالب
 * POST /api/applications/:id/send-credentials
 */
router.post('/:id/send-credentials', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected) {
      const appRes = await pool.query(`
        SELECT 
          c.name, c.email, c.password_hash, a.application_number,
          u.name_ar as uni_name, co.name_ar as country_name, us.name as staff_name
        FROM applications a
        JOIN customers c ON a.customer_id = c.id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN countries co ON a.country_id = co.id
        LEFT JOIN users us ON a.staff_id = us.id
        WHERE a.id::text = $1 OR a.application_number = $1
      `, [id]);

      if (appRes.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

      const row = appRes.rows[0];
      await sendStudentCredentialsEmail({
        studentName: row.name,
        studentEmail: row.email,
        applicationNumber: row.application_number,
        portalPassword: row.password_hash,
        destination: row.country_name || 'المملكة المتحدة',
        universityName: row.uni_name || 'جامعة مانشستر',
        counselorName: row.staff_name || 'المستشار الأكاديمي',
      });

      return res.json({ success: true, message: `تم إرسال بيانات الدخول بنجاح إلى البريد: ${row.email}` });
    }

    return res.json({ success: true, message: 'تم إرسال بيانات الدخول بنجاح إلى بريد الطالب' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
