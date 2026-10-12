/**
 * ============================================================================
 * مسارات طلبات القبول والطلاب (Applications API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { sendStudentCredentialsEmail, sendStatusUpdateNotification, sendCustomStudentEmailResponse } from '../services/emailService';
import { sendTelegramNotification } from '../services/telegramService';
import { saveUploadedDocument, resolveStoredFile, deleteStoredFile } from '../utils/fileStorage';
import { hashPassword, verifyPassword, generateStrongPassword } from '../services/passwordService';
import {
  createSession,
  destroySession,
  destroySessionsForApplication,
  STUDENT_SESSION_TTL_MS,
} from '../services/sessionService';
import {
  requireAuth,
  requireStaff,
  requireAdmin,
  canAccessApplication,
  isStaff,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../middleware/auth';
import { rateLimit, fail, failInternal } from '../middleware/security';

const router = Router();

/** استخراج المعرّف الرقمي للطلب من قاعدة البيانات (يقبل الرقم أو رقم الطلب) */
async function resolveApplicationId(idOrNumber: string): Promise<number | null> {
  if (!isPostgresConnected) {
    const app = inMemoryStore.applications.find(
      (a) => a.id.toString() === idOrNumber || a.application_number === idOrNumber
    );
    return app ? app.id : null;
  }
  const result = await pool.query(
    'SELECT id FROM applications WHERE id::text = $1 OR application_number = $1 LIMIT 1',
    [idOrNumber]
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

// Helper to generate the 7-stage roadmap for an application
function generateDefaultTimeline(status: string) {
  const stages = [
    { stage: 'submitted', titleAr: 'تم استلام الطلب', titleEn: 'Application Submitted', descriptionAr: 'تم تسجيل الطلب وتعيين مستشارك التعليمي الخاص', descriptionEn: 'Application received and personal counselor assigned', date: '2026-08-14' },
    { stage: 'under_review', titleAr: 'تدقيق الوثائق والأهلية', titleEn: 'Document Verification', descriptionAr: 'تمت مطابقة الشهادات والتأكد من شروط القبول', descriptionEn: 'Academic credentials verified against admission criteria', date: '2026-08-19' },
    { stage: 'sent_to_university', titleAr: 'تقديم الطلب للجامعة الشريكة', titleEn: 'Submitted to University', descriptionAr: 'تم إرسال الملف عبر نظام القبول المباشر في الجامعة', descriptionEn: 'Official file lodged directly with university admissions office', date: '2026-08-25' },
    { stage: 'conditional_offer', titleAr: 'صدور القبول المشروط (Conditional Offer)', titleEn: 'Conditional Offer Issued', descriptionAr: 'مبروك! أصدرت الجامعة قبولاً مشروطاً بإرفاق المستندات المطلوبة', descriptionEn: 'University issued offer letter subject to conditions', date: '2026-09-11' },
    { stage: 'unconditional_offer', titleAr: 'القبول النهائي والـ CAS / CoE', titleEn: 'Unconditional Offer & CAS', descriptionAr: 'إصدار رقم CAS لبدء إجراءات التأشيرة فوراً', descriptionEn: 'Issuance of Confirmation of Acceptance for Studies' },
    { stage: 'visa_processing', titleAr: 'التقديم على تأشيرة الطالب الدراسية', titleEn: 'Student Visa Application', descriptionAr: 'مرافقة خطوة بخطوة في فحص السل وبصمات التأشيرة والسكن', descriptionEn: 'Guidance through visa appointment and lodging' },
    { stage: 'approved_ready', titleAr: 'استلام التأشيرة والترتيب للسفر', titleEn: 'Visa Granted & Pre-Departure', descriptionAr: 'تأمين السكن الجامعي وحجز استقبال المطار والاستعداد للسفر', descriptionEn: 'Accommodation confirmed & flight departure briefing' },
  ];

  const stageOrderMap: Record<string, number> = {
    submitted: 1,
    under_review: 2,
    sent_to_university: 3,
    conditional_offer: 4,
    unconditional_offer: 5,
    visa_processing: 6,
    visa_granted: 7,
    approved_ready: 7,
  };

  const currentOrder = stageOrderMap[status] || 2;

  return stages.map((s, idx) => {
    const stepNum = idx + 1;
    return {
      ...s,
      isCompleted: stepNum < currentOrder || (stepNum === currentOrder && (status === 'visa_granted' || status === 'approved_ready')),
      isCurrent: stepNum === currentOrder,
    };
  });
}

// Normalizer to guarantee complete camelCase + snake_case compatibility for client and server
function formatApplicationForResponse(rawApp: any) {
  if (!rawApp) return null;

  const appNumber = rawApp.applicationNumber || rawApp.application_number || 'AFQ-2026-8812';
  const status = rawApp.status || 'under_review';
  const studentName = rawApp.studentName || rawApp.customer_name || rawApp.student_name || 'طالب آفاق العالمية';
  const studentEmail = rawApp.studentEmail || rawApp.customer_email || rawApp.student_email || 'student@afaq-global.com';
  const studentPhone = rawApp.studentPhone || rawApp.customer_phone || rawApp.student_phone || '+966 50 123 9876';
  const studentWhatsapp = rawApp.studentWhatsapp || rawApp.customer_whatsapp || rawApp.whatsapp || studentPhone;
  // ⛔ لا تُشتقّ كلمة مرور البوابة ولا تُعاد في أي استجابة.
  // (كان هذا السطر سابقاً يُعيد كلمة مرور الطالب نصاً صريحاً مع كل طلب.)
  
  const universityName = rawApp.universityName || rawApp.universityNameAr || rawApp.university_name_ar || rawApp.university_name_en || 'University of Manchester';
  const courseName = rawApp.courseName || rawApp.majorNameAr || rawApp.major_name_ar || rawApp.major_name_en || 'علوم الحاسب والذكاء الاصطناعي';

  const rawDocs = Array.isArray(rawApp.documents) ? rawApp.documents : [];
  const normalizedDocs = rawDocs.map((d: any, idx: number) => {
    const fileUrl = d.file_url || d.fileUrl || null;
    let fileName = d.fileName || d.file_name;
    if (!fileName && fileUrl && typeof fileUrl === 'string' && !fileUrl.startsWith('data:')) {
      fileName = fileUrl.split('/').pop();
    }
    const isDocUploaded = !!fileName || (!!fileUrl && fileUrl !== 'null');
    const docStatus = d.status || (isDocUploaded ? 'uploaded' : 'pending');

    return {
      id: d.id ? d.id.toString() : `d${idx + 1}`,
      nameAr: d.nameAr || d.name_ar || 'وثيقة رسمية',
      nameEn: d.nameEn || d.name_en || 'Official Document',
      category: d.category || d.doc_type || 'other',
      required: d.required !== undefined ? d.required : (d.doc_type === 'passport' || d.doc_type === 'transcript' || idx < 2),
      status: docStatus,
      fileName: fileName || undefined,
      fileSize: d.fileSize || d.file_size || (isDocUploaded ? '1.4 MB' : undefined),
      file_url: fileUrl || undefined,
      uploadedAt: d.uploadedAt || d.uploaded_at || (isDocUploaded ? '2026-09-12' : undefined),
      feedback: d.feedback || undefined,
    };
  });

  const formatted = {
    ...rawApp,
    id: rawApp.id ? rawApp.id.toString() : 'app-001',
    applicationNumber: appNumber,
    application_number: appNumber,
    studentName,
    studentEmail,
    studentPhone,
    studentWhatsapp,
    customer_name: studentName,
    customer_email: studentEmail,
    customer_phone: studentPhone,
    destination: rawApp.destination || (rawApp.country_id === 2 ? 'australia' : rawApp.country_id === 3 ? 'newzealand' : 'uk'),
    countryNameAr: rawApp.countryNameAr || rawApp.country_name_ar || 'المملكة المتحدة',
    universityName,
    universityNameAr: rawApp.universityNameAr || rawApp.university_name_ar || universityName,
    universityNameEn: rawApp.universityNameEn || rawApp.university_name_en || 'University of Manchester',
    courseName,
    studyLevel: rawApp.studyLevel || rawApp.study_level || 'bachelor',
    status,
    documents: normalizedDocs,
    timeline: rawApp.timeline && rawApp.timeline.length > 0 ? rawApp.timeline : generateDefaultTimeline(status),
    notes: Array.isArray(rawApp.notes) ? rawApp.notes : (rawApp.notes ? [rawApp.notes] : [
      'طالب مؤهل لمسار الابتعاث والمنح الدراسية.',
      'تم التحقق من جاهزية الوثائق الأكاديمية.',
    ]),
    counselorId: rawApp.counselorId !== undefined ? rawApp.counselorId?.toString() : (rawApp.staff_id ? rawApp.staff_id.toString() : undefined),
    counselorName: rawApp.counselorName || rawApp.counselor_name || undefined,
    counselorPhone: rawApp.counselorPhone || rawApp.counselor_phone || undefined,
  };

  // ⛔ حماية نهائية: نُزيل أي حقل يبدو كحقل كلمة مرور قبل إرجاع الاستجابة.
  // السبب: `...rawApp` تمرّر كل حقول الكائن المصدر، فأي مصدر يحتوي
  // portal_password أو password_hash كان سيتسرّب تلقائياً (حدث فعلاً في
  // مسار الذاكرة المتكاملة). هذا الفلتر يضمن عدم تكرار الخطأ مستقبلاً.
  const safe: Record<string, any> = {};
  for (const [key, value] of Object.entries(formatted)) {
    if (/password|passwd|secret|token/i.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

/**
 * جلب جميع طلبات القبول مع بيانات الطلاب والجامعات والمستندات
 * GET /api/applications — للموظفين فقط (تحتوي بيانات شخصية لكل الطلاب)
 */
router.get('/', requireStaff(), async (req: Request, res: Response) => {
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
          a.staff_id as "counselorId",
          us.name as "counselorName",
          us.phone as "counselorPhone",
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

      const formattedList = result.rows.map(formatApplicationForResponse);
      return res.json({ success: true, source: 'postgres', data: formattedList });
    }

    // In-memory fallback
    const formattedList = inMemoryStore.applications.map(formatApplicationForResponse);
    return res.json({ success: true, source: 'in-memory', data: formattedList });
  } catch (error: any) {
    console.error('Error fetching applications:', error.message);
    return failInternal(res, error);
  }
});

/**
 * جلب تفاصيل طلب واحد برقم الطلب أو المعرف
 * GET /api/applications/:id — للموظفين، أو للطالب صاحب الطلب فقط
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
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
          u.name_ar as "universityNameAr",
          u.name_en as "universityNameEn",
          m.name_ar as "majorNameAr",
          m.name_en as "majorNameEn",
          co.name_ar as "countryNameAr",
          co.name_en as "countryNameEn",
          a.staff_id as "counselorId",
          us.name as "counselorName",
          us.phone as "counselorPhone",
          COALESCE((SELECT json_agg(d.*) FROM documents d WHERE d.application_id = a.id), '[]') as documents,
          COALESCE((SELECT json_agg(msg.*) FROM messages msg WHERE msg.application_id = a.id), '[]') as messages
        FROM applications a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN universities u ON a.university_id = u.id
        LEFT JOIN majors m ON a.major_id = m.id
        LEFT JOIN countries co ON a.country_id = co.id
        LEFT JOIN users us ON a.staff_id = us.id
        WHERE a.id::text = $1 OR a.application_number = $1
      `, [id]);

      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      // فحص الملكية: الطالب يرى طلبه فقط
      if (!canAccessApplication(req, Number(result.rows[0].id))) {
        return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى هذا الطلب' });
      }
      return res.json({ success: true, data: formatApplicationForResponse(result.rows[0]) });
    }

    const app = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
    if (!app) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    if (!canAccessApplication(req, app.id)) {
      return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى هذا الطلب' });
    }
    return res.json({ success: true, data: formatApplicationForResponse(app) });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * تقديم طلب قبول جديد — مسار عام (نموذج الموقع)، ومحدود المعدّل ضد الإساءة
 * POST /api/applications
 */
router.post(
  '/',
  rateLimit({
    name: 'public-application',
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'تم استلام عدد كبير من الطلبات من هذا الجهاز. حاول لاحقاً.',
  }),
  async (req: Request, res: Response) => {
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

    const appNumber = `AFQ-2026-${crypto.randomInt(1000, 10000)}`;
    // كلمة مرور قوية عشوائية للبوابة — تُشفَّر قبل الحفظ ولا تُعاد في أي استجابة
    const portalPasswordPlain = generateStrongPassword(12);
    const portalPasswordHash = await hashPassword(portalPasswordPlain);

    if (isPostgresConnected) {
      // 1. جلب العميل إن وُجد وإلا إنشاؤه بكلمة مرور مُشفّرة.
      //    لا نستبدل بيانات عميل قائم: السلوك السابق (ON CONFLICT DO UPDATE)
      //    كان يسمح لأي شخص بتقديم طلب ببريد شخص آخر فيكتب اسمه وهاتفه فوق سجله.
      const existingCustomer = await pool.query(
        'SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [studentEmail]
      );

      let customerId: number;
      let passwordWasGenerated = false;

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      } else {
        const customerRes = await pool.query(
          `INSERT INTO customers (name, email, phone, whatsapp, password_hash)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [studentName, studentEmail, studentPhone, studentWhatsapp || studentPhone, portalPasswordHash]
        );
        customerId = customerRes.rows[0].id;
        passwordWasGenerated = true;
      }

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

      // 5. إشعار الطالب بالبريد الإلكتروني (بكلمة المرور الجديدة فقط)
      if (passwordWasGenerated) {
        try {
          await sendStudentCredentialsEmail({
            studentName,
            studentEmail,
            applicationNumber: appNumber,
            portalPassword: portalPasswordPlain,
            destination: 'المملكة المتحدة',
            universityName: 'طلب قيد التوزيع الأكاديمي',
            counselorName: staffName,
          });
        } catch (e) {
          console.warn('Email notification warning:', e);
        }
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
      // كلمة المرور تُخزَّن مُشفّرة فقط، ولا تُعاد في الاستجابة
      portal_password: portalPasswordHash,
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
    return failInternal(res, error);
  }
  }
);

/**
 * تحديث حالة طلب معين وتسجيل التغيير
 * PATCH /api/applications/:id/status — للموظفين فقط
 */
router.patch('/:id/status', requireStaff(), async (req: Request, res: Response) => {
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
    return failInternal(res, error);
  }
});

/**
 * تحديث حالة مستند معين (اعتماد / رفض / طلب إعادة رفع)
 * PATCH /api/applications/:id/documents/:docId — للموظفين فقط
 */
router.patch('/:id/documents/:docId', requireStaff(), async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;
    const { status, feedback } = req.body;

    if (isPostgresConnected) {
      let result = await pool.query(
        'UPDATE documents SET status = $1, feedback = $2 WHERE (id::text = $3 OR doc_type = $3) AND application_id IN (SELECT id FROM applications WHERE id::text = $4 OR application_number = $4) RETURNING *',
        [status, feedback || null, docId, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'المستند غير موجود' });
      return res.json({ success: true, message: 'تم تحديث حالة المستند بنجاح', data: result.rows[0] });
    }

    const app = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
    if (!app) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    if (app.documents) {
      const doc = app.documents.find((d: any) => 
        d.id?.toString() === docId.toString() || 
        d.doc_type === docId || 
        d.category === docId
      );
      if (doc) {
        doc.status = status;
        if (feedback !== undefined) (doc as any).feedback = feedback;
        saveStoreToDisk();
        return res.json({ success: true, message: 'تم تحديث حالة المستند بنجاح', data: doc });
      }
    }

    saveStoreToDisk();
    return res.json({ success: true, message: 'تم تحديث حالة المستند بنجاح' });
  } catch (error: any) {
    return failInternal(res, error);
  }
});

/**
 * تحديث شامل لبيانات الطلب والمستندات
 * PUT /api/applications/:id — للموظفين فقط
 */
router.put('/:id', requireStaff(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isPostgresConnected) {
      const appRes = await pool.query('SELECT id FROM applications WHERE id::text = $1 OR application_number = $1 LIMIT 1', [id]);
      if (appRes.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      const numericId = appRes.rows[0].id;

      if (updateData.status) {
        await pool.query('UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2', [updateData.status, numericId]);
      }
      if (updateData.portalPassword) {
        // تُشفَّر كلمة المرور قبل الحفظ، وتُبطَل جلسات الطالب الحالية
        if (String(updateData.portalPassword).length < 8) {
          return res.status(400).json({ success: false, error: 'كلمة مرور البوابة يجب أن تكون 8 أحرف على الأقل' });
        }
        const newPortalHash = await hashPassword(String(updateData.portalPassword));
        await pool.query(
          'UPDATE customers SET password_hash = $1 WHERE id = (SELECT customer_id FROM applications WHERE id = $2)',
          [newPortalHash, numericId]
        );
        destroySessionsForApplication(numericId);
      }
      if (updateData.counselorId !== undefined || updateData.staffId !== undefined || updateData.staff_id !== undefined) {
        const rawStaffId = updateData.counselorId || updateData.staffId || updateData.staff_id;
        const newStaffId = rawStaffId ? Number(rawStaffId) : null;
        if (newStaffId === null || !isNaN(newStaffId)) {
          await pool.query('UPDATE applications SET staff_id = $1, updated_at = NOW() WHERE id = $2', [newStaffId, numericId]);
        }
      }
      if (Array.isArray(updateData.documents)) {
        for (const doc of updateData.documents) {
          if (doc.id && !isNaN(Number(doc.id))) {
            await pool.query(
              'UPDATE documents SET status = COALESCE($1, status), feedback = COALESCE($2, feedback) WHERE id = $3 AND application_id = $4',
              [doc.status, doc.feedback || null, Number(doc.id), numericId]
            );
          }
        }
      }

      return res.json({ success: true, message: 'تم تحديث الطلب بنجاح في قاعدة البيانات' });
    }

    const app = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
    if (!app) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    if (updateData.status) app.status = updateData.status;
    if (updateData.portalPassword) {
      if (String(updateData.portalPassword).length < 8) {
        return res.status(400).json({ success: false, error: 'كلمة مرور البوابة يجب أن تكون 8 أحرف على الأقل' });
      }
      app.portal_password = await hashPassword(String(updateData.portalPassword));
      delete (app as any).portalPassword;
      destroySessionsForApplication(app.id);
    }
    if (updateData.notes) app.notes = updateData.notes;
    if (updateData.counselorId !== undefined) {
      (app as any).counselorId = updateData.counselorId;
    }
    if (updateData.counselorName !== undefined) {
      (app as any).counselorName = updateData.counselorName;
    }
    if (updateData.counselorPhone !== undefined) {
      (app as any).counselorPhone = updateData.counselorPhone;
    }
    if (Array.isArray(updateData.documents)) {
      app.documents = updateData.documents;
    }
    (app as any).updated_at = new Date().toISOString();

    return res.json({ success: true, message: 'تم تحديث بيانات الطلب بنجاح', data: formatApplicationForResponse(app) });
  } catch (error: any) {
    return failInternal(res, error);
  }
});

/**
 * رفع مستند جديد أو تحديث ملف مستند موجود من قبل الطالب
 * POST /api/applications/:id/documents
 * يحتاج جلسة: الموظف يرفع لأي طلب، والطالب لطلبه فقط.
 * نوع الملف وحجمه يُفحصان من محتوى الملف نفسه.
 */
router.post('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let { docId, docType, nameAr, nameEn, fileName, fileSize, fileUrl } = req.body;

    if (!fileName && !fileUrl) {
      return res.status(400).json({ success: false, error: 'اسم الملف أو بيانات الملف مطلوبة للرفع' });
    }

    // فحص الملكية قبل أي عملية
    const ownerAppId = await resolveApplicationId(id);
    if (ownerAppId === null) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    if (!canAccessApplication(req, ownerAppId)) {
      return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى هذا الطلب' });
    }

    const effectiveFileName = fileName || 'document.pdf';
    let savedFileUrl = '';
    let calculatedSize = fileSize || '1.2 MB';

    // بيانات الملف بصيغة base64 → تُحفظ في مجلد خاص خارج public/
    // النوع والحجم يُفحصان داخل saveUploadedDocument (توقيع ثنائي + قائمة بيضاء)
    if (fileUrl && (fileUrl.startsWith('data:') || fileUrl.length > 500)) {
      try {
        const saved = saveUploadedDocument(id, docType || 'other', effectiveFileName, fileUrl);
        savedFileUrl = saved.fileUrl;
        calculatedSize = saved.fileSize || fileSize || '1.2 MB';
      } catch (err: any) {
        // نُظهر سبب الرفض (نوع غير مدعوم / حجم كبير) بدل تجاهله
        return res.status(400).json({ success: false, error: err?.message || 'تعذّر حفظ الملف المرفوع' });
      }
    } else {
      // ⛔ لا يُقبل مسار ملفّي من العميل إطلاقاً.
      // (كان الكود السابق يخزّن أي نص يرسله العميل كـ file_url، وهو ما سمح
      //  بقراءة أي ملف على السيرفر عبر مسار التنزيل.)
      return res.status(400).json({
        success: false,
        error: 'يجب رفع محتوى الملف نفسه (base64) ولا يُقبل رابط أو مسار',
      });
    }

    if (isPostgresConnected) {
      // Find numeric application id
      const appRes = await pool.query('SELECT id, application_number FROM applications WHERE id::text = $1 OR application_number = $1 LIMIT 1', [id]);
      if (appRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود في قاعدة البيانات' });
      }
      const appId = appRes.rows[0].id;

      // البحث عن المستند بالـ ID الرقمي أو بنوع الوثيقة category/doc_type
      let existingDocId: number | null = null;
      if (docId && !isNaN(Number(docId))) {
        const checkRes = await pool.query('SELECT id FROM documents WHERE id = $1 AND application_id = $2 LIMIT 1', [Number(docId), appId]);
        if (checkRes.rows.length > 0) existingDocId = checkRes.rows[0].id;
      }

      if (!existingDocId && docType && docType !== 'other') {
        const checkRes = await pool.query('SELECT id FROM documents WHERE application_id = $1 AND doc_type = $2 LIMIT 1', [appId, docType]);
        if (checkRes.rows.length > 0) existingDocId = checkRes.rows[0].id;
      }

      if (!existingDocId && nameAr) {
        const checkRes = await pool.query('SELECT id FROM documents WHERE application_id = $1 AND (name_ar = $2 OR name_en = $3) LIMIT 1', [appId, nameAr, nameEn || nameAr]);
        if (checkRes.rows.length > 0) existingDocId = checkRes.rows[0].id;
      }

      let docRecord: any;
      if (existingDocId) {
        const updateRes = await pool.query(
          `UPDATE documents 
           SET file_url = $1, 
               status = 'uploaded', 
               name_ar = COALESCE($2, name_ar), 
               name_en = COALESCE($3, name_en), 
               file_name = $4, 
               file_size = $5, 
               uploaded_at = NOW() 
           WHERE id = $6 AND application_id = $7 
           RETURNING *`,
          [savedFileUrl, nameAr || null, nameEn || null, effectiveFileName, calculatedSize, existingDocId, appId]
        );
        docRecord = updateRes.rows[0];
      } else {
        const insertRes = await pool.query(
          `INSERT INTO documents (application_id, doc_type, name_ar, name_en, status, file_url, file_name, file_size, uploaded_at) 
           VALUES ($1, $2, $3, $4, 'uploaded', $5, $6, $7, NOW()) 
           RETURNING *`,
          [appId, docType || 'other', nameAr || effectiveFileName, nameEn || effectiveFileName, savedFileUrl, effectiveFileName, calculatedSize]
        );
        docRecord = insertRes.rows[0];
      }

      // إضافة إشعار داخلي في سجل الرسائل
      try {
        await pool.query(
          `INSERT INTO messages (application_id, sender_type, sender_name, message_text, is_internal_note, sent_at)
           VALUES ($1, 'system', 'بوابة الطالب', $2, true, NOW())`,
          [appId, `قام الطالب برفع وثيقة جديدة: (${nameAr || effectiveFileName}) - جاهزة للمراجعة والاعتماد`]
        );
      } catch (e) {}

      const formattedDoc = {
        id: docRecord.id.toString(),
        doc_type: docRecord.doc_type,
        category: docRecord.doc_type,
        name_ar: docRecord.name_ar,
        name_en: docRecord.name_en,
        nameAr: docRecord.name_ar,
        nameEn: docRecord.name_en,
        status: 'uploaded',
        fileName: docRecord.file_name || effectiveFileName,
        file_name: docRecord.file_name || effectiveFileName,
        fileSize: docRecord.file_size || calculatedSize,
        file_size: docRecord.file_size || calculatedSize,
        fileUrl: savedFileUrl,
        file_url: savedFileUrl,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploaded_at: docRecord.uploaded_at || new Date().toISOString(),
      };

      return res.json({ success: true, message: 'تم رفع المستند بنجاح وحفظه في قاعدة البيانات والخادم', data: formattedDoc });
    }

    // In-memory fallback persisted to disk
    const app = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
    if (!app) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    if (!app.documents) app.documents = [];
    const existingIndex = app.documents.findIndex((d: any) => 
      (docId && d.id?.toString() === docId.toString()) || 
      (docType && docType !== 'other' && (d.doc_type === docType || d.category === docType)) ||
      (nameAr && (d.name_ar === nameAr || d.nameAr === nameAr))
    );

    const docObj: any = {
      id: existingIndex >= 0 ? app.documents[existingIndex].id : (docId || `doc-${Date.now()}`),
      doc_type: docType || 'other',
      category: docType || 'other',
      name_ar: nameAr || effectiveFileName,
      name_en: nameEn || effectiveFileName,
      nameAr: nameAr || effectiveFileName,
      nameEn: nameEn || effectiveFileName,
      status: 'uploaded',
      fileName: effectiveFileName,
      file_name: effectiveFileName,
      fileSize: calculatedSize,
      file_size: calculatedSize,
      fileUrl: savedFileUrl,
      file_url: savedFileUrl,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploaded_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      app.documents[existingIndex] = { ...app.documents[existingIndex], ...docObj };
    } else {
      app.documents.push(docObj);
    }
    (app as any).updated_at = new Date().toISOString();

    // حفظ التحديث فوراً في ملف store.json على القرص
    saveStoreToDisk();

    return res.json({ success: true, message: 'تم حفظ ورفع المستند بنجاح على السيرفر', data: docObj });
  } catch (error: any) {
    console.error('Error in POST /documents:', error);
    return failInternal(res, error);
  }
});

/**
 * حذف أو إعادة تعيين مستند من الطلب
 * DELETE /api/applications/:id/documents/:docId — يحتاج جلسة (الموظف أو صاحب الطلب)
 * يُحذف الملف من القرص فعلياً، لا يُفرَّغ المسار فقط.
 */
router.delete('/:id/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;

    const ownerAppId = await resolveApplicationId(id);
    if (ownerAppId === null) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    if (!canAccessApplication(req, ownerAppId)) {
      return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى هذا الطلب' });
    }

    if (isPostgresConnected) {
      // نجلب مسار الملف قبل تفريغه حتى نحذف الملف نفسه من القرص
      const docRes = await pool.query(
        'SELECT id, file_url FROM documents WHERE id::text = $1 AND application_id = $2 LIMIT 1',
        [docId, ownerAppId]
      );
      if (docRes.rows.length > 0 && docRes.rows[0].file_url) {
        deleteStoredFile(docRes.rows[0].file_url);
      }
      await pool.query(
        'UPDATE documents SET file_url = NULL, status = $1, file_name = NULL, file_size = NULL WHERE id::text = $2 AND application_id = $3',
        ['pending', docId, ownerAppId]
      );
      return res.json({ success: true, message: 'تم حذف المستند بنجاح' });
    }

    const app = inMemoryStore.applications.find(a => a.id === ownerAppId);
    if (app && app.documents) {
      const targetDoc = app.documents.find((d: any) => d.id?.toString() === docId.toString());
      if (targetDoc) {
        const storedRef = (targetDoc as any).file_url || (targetDoc as any).fileUrl;
        deleteStoredFile(storedRef);
        (targetDoc as any).status = 'pending';
        delete (targetDoc as any).fileName;
        delete (targetDoc as any).file_name;
        delete (targetDoc as any).fileSize;
        delete (targetDoc as any).file_size;
        delete (targetDoc as any).file_url;
        delete (targetDoc as any).fileUrl;
        saveStoreToDisk();
      }
    }

    return res.json({ success: true, message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * عرض وتنزيل ملف المستند المرفوع
 * GET /api/applications/:id/documents/:docId/file
 * يحتاج جلسة: الموظف يصل لأي مستند، والطالب لمستندات طلبه فقط.
 * المسار يُشتقّ من معرّف الملف المخزّن في قاعدة البيانات فقط — لا من أي مدخل عميل.
 */
router.get('/:id/documents/:docId/file', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, docId } = req.params;

    // 1. فحص الملكية
    const ownerAppId = await resolveApplicationId(id);
    if (ownerAppId === null) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    if (!canAccessApplication(req, ownerAppId)) {
      return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى هذا المستند' });
    }

    // 2. جلب مرجع الملف من قاعدة البيانات لهذا الطلب تحديداً
    let storedRef = '';
    let fileName = 'document.pdf';

    if (isPostgresConnected) {
      const docRes = await pool.query(
        'SELECT file_url, file_name, name_ar FROM documents WHERE id::text = $1 AND application_id = $2 LIMIT 1',
        [docId, ownerAppId]
      );
      if (docRes.rows.length > 0) {
        storedRef = docRes.rows[0].file_url || '';
        fileName = docRes.rows[0].file_name || docRes.rows[0].name_ar || 'document.pdf';
      }
    } else {
      const app = inMemoryStore.applications.find((a) => a.id === ownerAppId);
      const doc: any = app?.documents?.find(
        (d: any) => d.id?.toString() === docId.toString() || d.doc_type === docId || d.category === docId
      );
      if (doc) {
        storedRef = doc.file_url || doc.fileUrl || '';
        fileName = doc.file_name || doc.fileName || doc.name_ar || doc.nameAr || 'document.pdf';
      }
    }

    if (!storedRef) {
      return res.status(404).json({ success: false, error: 'لا يوجد ملف مرفوع لهذا المستند' });
    }

    // 3. دعم القيم القديمة المخزّنة كـ data: URL مباشرة
    if (storedRef.startsWith('data:')) {
      const matches = storedRef.match(/^data:(application\/pdf|image\/jpeg|image\/png|image\/webp);base64,(.*)$/);
      if (!matches) {
        return res.status(415).json({ success: false, error: 'نوع الملف المخزّن غير مسموح' });
      }
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', matches[1]);
      // attachment وليس inline — يمنع تنفيذ أي محتوى في سياق الموقع
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.send(buffer);
    }

    // 4. حلّ المرجع إلى مسار داخل مجلد التخزين الخاص فقط.
    //    resolveStoredFile يرفض أي قيمة تحتوي .. أو محارف مسار أو امتداداً غير مسموح.
    const resolved = resolveStoredFile(storedRef);
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'تعذر العثور على الملف' });
    }

    res.setHeader('Content-Type', resolved.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(resolved.absolutePath);
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * تسجيل دخول بوابة الطالب المخصصة
 * POST /api/applications/portal-login
 * محدود المعدّل — ولا توجد أي كلمة مرور افتراضية مقبولة.
 */
router.post(
  '/portal-login',
  rateLimit({
    name: 'portal-login',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'عدد محاولات الدخول كبير جداً. حاول مرة أخرى بعد 15 دقيقة.',
  }),
  async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'رقم الطلب أو البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    const trimmedLogin = String(loginId).trim();
    const trimmedPass = String(password);

    // رد موحّد لكل حالات الفشل — يمنع كشف أي حساب موجود
    const invalid = () => res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });

    const fullAppQuery = `
      SELECT
        a.*,
        a.application_number as "applicationNumber",
        a.id as "resolvedId",
        c.name as "studentName",
        c.email as "studentEmail",
        c.phone as "studentPhone",
        c.whatsapp as "studentWhatsapp",
        c.password_hash as "__passwordHash",
        u.name_ar as "universityNameAr",
        u.name_en as "universityNameEn",
        m.name_ar as "majorNameAr",
        m.name_en as "majorNameEn",
        co.name_ar as "countryNameAr",
        a.staff_id as "counselorId",
        us.name as "counselorName",
        us.phone as "counselorPhone",
        COALESCE((SELECT json_agg(d.*) FROM documents d WHERE d.application_id = a.id), '[]') as documents,
        COALESCE((SELECT json_agg(msg.*) FROM messages msg WHERE msg.application_id = a.id), '[]') as messages
      FROM applications a
      JOIN customers c ON a.customer_id = c.id
      LEFT JOIN universities u ON a.university_id = u.id
      LEFT JOIN majors m ON a.major_id = m.id
      LEFT JOIN countries co ON a.country_id = co.id
      LEFT JOIN users us ON a.staff_id = us.id
      WHERE (a.application_number = $1 OR c.email = $1)
      LIMIT 1
    `;

    if (isPostgresConnected) {
      const result = await pool.query(fullAppQuery, [trimmedLogin]);
      if (result.rows.length === 0) return invalid();

      const row = result.rows[0];
      const storedHash = row.__passwordHash;
      if (!storedHash) return invalid();

      const verdict = await verifyPassword(trimmedPass, storedHash);
      if (!verdict.ok) return invalid();

      // ترحيل شفّاف للقيم القديمة المخزّنة كنص صريح
      if (verdict.needsRehash) {
        try {
          const upgraded = await hashPassword(trimmedPass);
          await pool.query('UPDATE customers SET password_hash = $1 WHERE id = $2', [upgraded, row.customer_id]);
          console.log(`🔐 [Portal] تم ترحيل كلمة مرور الطالب للطلب #${row.id}`);
        } catch (migErr) {
          console.error('⚠️ [Portal] فشل ترحيل كلمة المرور:', migErr);
        }
      }

      const resolvedId = Number(row.resolvedId);
      const { token } = createSession(
        {
          kind: 'student',
          applicationId: resolvedId,
          name: row.studentName,
          email: row.studentEmail,
        },
        STUDENT_SESSION_TTL_MS
      );
      res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(STUDENT_SESSION_TTL_MS));

      // لا نُمرّر حقل كلمة المرور إلى دالة التنسيق إطلاقاً
      delete row.__passwordHash;

      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: formatApplicationForResponse(row),
        token,
        expiresInMs: STUDENT_SESSION_TTL_MS,
      });
    }

    // النسخة الاحتياطية في الذاكرة
    const app = inMemoryStore.applications.find(
      (a) =>
        a.application_number === trimmedLogin ||
        a.customer_email === trimmedLogin ||
        a.id.toString() === trimmedLogin
    );
    if (!app) return invalid();

    const storedHash = (app as any).portal_password || (app as any).portalPassword || '';
    const verdict = await verifyPassword(trimmedPass, storedHash);
    if (!verdict.ok) return invalid();

    if (verdict.needsRehash) {
      (app as any).portal_password = await hashPassword(trimmedPass);
      delete (app as any).portalPassword;
      saveStoreToDisk();
    }

    const { token } = createSession(
      {
        kind: 'student',
        applicationId: app.id,
        name: app.customer_name,
        email: app.customer_email,
      },
      STUDENT_SESSION_TTL_MS
    );
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(STUDENT_SESSION_TTL_MS));

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: formatApplicationForResponse(app),
      token,
      expiresInMs: STUDENT_SESSION_TTL_MS,
    });
  } catch (error) {
    return failInternal(res, error);
  }
  }
);

/**
 * تسجيل خروج الطالب
 * POST /api/applications/portal-logout
 */
router.post('/portal-logout', requireAuth, (req: Request, res: Response) => {
  destroySession(req.authToken);
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

/**
 * التحقق من جلسة الطالب الحالية (بديل الوثوق بما في localStorage)
 * GET /api/applications/portal-session
 */
router.get('/portal-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = req.auth!;
    if (session.kind === 'staff') {
      return res.json({ success: true, kind: 'staff', user: { id: session.userId, name: session.name, role: session.role } });
    }
    const appId = session.applicationId;
    if (!appId) return res.status(401).json({ success: false, error: 'جلسة غير صالحة' });

    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT a.*, a.application_number as "applicationNumber", a.id as "resolvedId",
                c.name as "studentName", c.email as "studentEmail", c.phone as "studentPhone",
                c.whatsapp as "studentWhatsapp",
                u.name_ar as "universityNameAr", u.name_en as "universityNameEn",
                m.name_ar as "majorNameAr", m.name_en as "majorNameEn",
                co.name_ar as "countryNameAr",
                a.staff_id as "counselorId", us.name as "counselorName", us.phone as "counselorPhone",
                COALESCE((SELECT json_agg(d.*) FROM documents d WHERE d.application_id = a.id), '[]') as documents,
                COALESCE((SELECT json_agg(msg.*) FROM messages msg WHERE msg.application_id = a.id), '[]') as messages
         FROM applications a
         JOIN customers c ON a.customer_id = c.id
         LEFT JOIN universities u ON a.university_id = u.id
         LEFT JOIN majors m ON a.major_id = m.id
         LEFT JOIN countries co ON a.country_id = co.id
         LEFT JOIN users us ON a.staff_id = us.id
         WHERE a.id = $1 LIMIT 1`,
        [appId]
      );
      if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'جلسة غير صالحة' });
      return res.json({ success: true, kind: 'student', data: formatApplicationForResponse(result.rows[0]) });
    }

    const app = inMemoryStore.applications.find((a) => a.id === appId);
    if (!app) return res.status(401).json({ success: false, error: 'جلسة غير صالحة' });
    return res.json({ success: true, kind: 'student', data: formatApplicationForResponse(app) });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * تحديث كلمة المرور الخاصة بالطالب — للموظفين فقط
 * PATCH /api/applications/:id/portal-password
 */
router.patch('/:id/portal-password', requireStaff(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة مطلوبة' });
    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }

    const appId = await resolveApplicationId(id);
    if (appId === null) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    const newHash = await hashPassword(String(newPassword));

    if (isPostgresConnected) {
      await pool.query(
        `UPDATE customers SET password_hash = $1
         WHERE id = (SELECT customer_id FROM applications WHERE id = $2)`,
        [newHash, appId]
      );
      // إبطال أي جلسة قائمة لهذا الطلب حتى تُستخدم الكلمة الجديدة
      destroySessionsForApplication(appId);
      return res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
    }

    const app = inMemoryStore.applications.find((a) => a.id === appId);
    if (app) {
      (app as any).portal_password = newHash;
      delete (app as any).portalPassword;
      saveStoreToDisk();
    }
    destroySessionsForApplication(appId);
    return res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * إصدار كلمة مرور جديدة للطالب وإرسالها إلى بريده — للموظفين فقط
 * POST /api/applications/:id/send-credentials
 *
 * ملاحظة مهمّة: لم يعد ممكناً استرجاع كلمة المرور القديمة (لأنها مُشفّرة)،
 * لذلك يُولَّد هنا بديل جديد ويُحفظ مُشفّراً ويُرسل للطالب.
 */
router.post('/:id/send-credentials', requireStaff(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appId = await resolveApplicationId(id);
    if (appId === null) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    const plainPassword = generateStrongPassword(12);
    const passwordHash = await hashPassword(plainPassword);

    if (isPostgresConnected) {
      const appRes = await pool.query(
        `SELECT c.id as customer_id, c.name, c.email, a.application_number,
                u.name_ar as uni_name, co.name_ar as country_name, us.name as staff_name
         FROM applications a
         JOIN customers c ON a.customer_id = c.id
         LEFT JOIN universities u ON a.university_id = u.id
         LEFT JOIN countries co ON a.country_id = co.id
         LEFT JOIN users us ON a.staff_id = us.id
         WHERE a.id = $1`,
        [appId]
      );
      if (appRes.rows.length === 0) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

      const row = appRes.rows[0];
      await pool.query('UPDATE customers SET password_hash = $1 WHERE id = $2', [passwordHash, row.customer_id]);
      destroySessionsForApplication(appId);

      await sendStudentCredentialsEmail({
        studentName: row.name,
        studentEmail: row.email,
        applicationNumber: row.application_number,
        portalPassword: plainPassword,
        destination: row.country_name || 'المملكة المتحدة',
        universityName: row.uni_name || 'جامعة مانشستر',
        counselorName: row.staff_name || 'المستشار الأكاديمي',
      });

      return res.json({
        success: true,
        message: `تم إصدار كلمة مرور جديدة وإرسالها إلى البريد: ${row.email}`,
        // تُعاد مرة واحدة ليتمكن الموظف من تسليمها عبر الواتساب إن لزم
        generatedPassword: plainPassword,
      });
    }

    const app = inMemoryStore.applications.find((a) => a.id === appId);
    if (app) {
      (app as any).portal_password = passwordHash;
      delete (app as any).portalPassword;
      saveStoreToDisk();
    }
    destroySessionsForApplication(appId);

    return res.json({
      success: true,
      message: 'تم إصدار كلمة مرور جديدة للطالب',
      generatedPassword: plainPassword,
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * إرسال خطاب/رد رسمي وتنبيهات مخصصة للطالب — للموظفين فقط
 * POST /api/applications/:id/send-response
 */
router.post('/:id/send-response', requireStaff(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { channel, messageText } = req.body;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ success: false, error: 'نص الرسالة مطلوب' });
    }

    let studentEmail = '';
    let studentName = '';
    let appNum = '';

    if (isPostgresConnected) {
      const appRes = await pool.query(`
        SELECT c.name, c.email, a.application_number
        FROM applications a
        JOIN customers c ON a.customer_id = c.id
        WHERE a.id::text = $1 OR a.application_number = $1
      `, [id]);

      if (appRes.rows.length > 0) {
        studentName = appRes.rows[0].name;
        studentEmail = appRes.rows[0].email;
        appNum = appRes.rows[0].application_number;
      }
    }

    if (!studentEmail) {
      const app: any = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
      if (app) {
        studentName = app.customer_name || app.student_name || app.studentName || 'الطالب';
        studentEmail = app.customer_email || app.studentEmail || 'student@example.com';
        appNum = app.application_number || app.id.toString();
      }
    }

    // حفظ الرسالة الصادرة في قاعدة البيانات وفي قائمة الرسائل
    if (isPostgresConnected) {
      await pool.query(
        `INSERT INTO messages (application_id, sender_type, sender_name, message_text, is_internal_note)
         VALUES ((SELECT id FROM applications WHERE id::text = $1 OR application_number = $1 LIMIT 1), 'user', 'مستشار القبول', $2, false)`,
        [id, messageText]
      );
    } else {
      const app = inMemoryStore.applications.find(a => a.id.toString() === id || a.application_number === id);
      if (app) {
        if (!app.messages) app.messages = [];
        app.messages.push({
          id: Date.now(),
          sender_type: 'user',
          sender_name: 'مستشار القبول',
          message_text: messageText,
          is_internal_note: false,
          sent_at: new Date().toISOString()
        });
        saveStoreToDisk();
      }
    }

    // إرسال البريد الإلكتروني الفعلي للطالب إذا كانت القناة هي email
    if (channel === 'email' && studentEmail) {
      await sendCustomStudentEmailResponse({
        studentName: studentName || 'عزيزي الطالب',
        studentEmail,
        applicationNumber: appNum || id,
        messageText,
      });
    }

    return res.json({
      success: true,
      message: `تم إرسال الرد بنجاح إلى الطالب (${studentEmail || studentName}) عبر ${channel === 'email' ? 'البريد الإلكتروني' : channel === 'whatsapp' ? 'الواتساب' : 'التلغرام'}`
    });
  } catch (error: any) {
    console.error('Error sending student response:', error);
    return res.status(500).json({ success: false, error: error.message || 'حدث خطأ في السيرفر أثناء الإرسال' });
  }
});

export default router;
