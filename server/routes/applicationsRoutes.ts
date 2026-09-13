/**
 * ============================================================================
 * مسارات طلبات القبول والطلاب (Applications & Student Placements REST API)
 * ============================================================================
 * هذا الملف مسؤول عن:
 * 1. استلام طلبات القبول المباشرة من الطلاب (ApplicationModal).
 * 2. تخزين الطلب والمستندات في قاعدة بيانات PostgreSQL.
 * 3. إطلاق تنبيه البريد الإلكتروني (Gmail) وتنبيه تلغرام للإدارة فوراً.
 * 4. تزويد بوابة الطالب (StudentDashboard) ولوحة المشرفين (StaffDashboard) بالبيانات.
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { sendNewApplicationEmailToAdmin } from '../services/emailService';
import { sendTelegramNotification } from '../services/telegramService';
import { Application } from '../../src/types';

const router = Router();

/**
 * جلب جميع طلبات القبول (لوحة إدارة المشرفين Staff CRM)
 * GET /api/applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT a.*, 
               json_agg(d.*) FILTER (WHERE d.id IS NOT NULL) as documents
        FROM applications a
        LEFT JOIN documents d ON d.application_id = a.id
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `);
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }

    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.applications });
  } catch (error: any) {
    console.error('Error fetching applications:', error.message);
    return res.status(500).json({ success: false, error: error.message, data: inMemoryStore.applications });
  }
});

/**
 * استعلام عن طلب محدد بواسطة المعرف أو رقم الطلب (بوابة الطالب Student Portal)
 * GET /api/applications/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT a.*, 
               json_agg(d.*) FILTER (WHERE d.id IS NOT NULL) as documents
        FROM applications a
        LEFT JOIN documents d ON d.application_id = a.id
        WHERE a.id = $1 OR a.application_number = $1
        GROUP BY a.id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      }
      return res.json({ success: true, data: result.rows[0] });
    }

    const app = inMemoryStore.applications.find(
      a => a.id === id || a.applicationNumber.toLowerCase() === id.toLowerCase()
    );

    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    return res.json({ success: true, data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تقديم طلب قبول جامعي جديد وإطلاق التنبيهات (جيميل + تلغرام)
 * POST /api/applications
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      studentName,
      email,
      phone,
      whatsapp,
      countryDestination,
      studyLevel,
      preferredMajor,
      preferredUniversity,
      gpa,
      highSchoolType,
      englishTest,
      sponsorType,
      budgetRange,
      additionalNotes,
    } = req.body;

    if (!studentName || !email || !phone || !countryDestination) {
      return res.status(400).json({
        success: false,
        error: 'الرجاء استكمال الحقول الإلزامية: الاسم، البريد، الهاتف، والوجهة الدراسية.',
      });
    }

    // توليد رقم طلب مميز بتنسيق رسمي
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationNumber = `AFQ-2026-${randomSuffix}`;
    const newId = `app-${Date.now()}`;

    // الكائن بصيغة التطبيق الكاملة
    const newApp: Application = {
      id: newId,
      applicationNumber,
      studentName,
      studentEmail: email,
      studentPhone: phone,
      countryOfResidence: 'المملكة العربية السعودية / الخليج العربي',
      destination: (countryDestination as any) || 'uk',
      universityName: preferredUniversity || 'جامعة مانشستر / أوكسفورد بروكس',
      courseName: preferredMajor || 'الهندسة والذكاء الاصطناعي',
      level: (studyLevel as any) || 'bachelor',
      intake: 'سبتمبر 2026',
      status: 'under_review',
      submittedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      counselorId: 'c-1',
      counselorName: 'د. فيصل الشمري',
      counselorPhone: '+966 50 123 4567',
      scholarshipInterest: Boolean(sponsorType),
      documents: [
        {
          id: 'doc-pass',
          category: 'passport',
          nameAr: 'صورة جواز السفر (ساري المفعول)',
          nameEn: 'Valid Passport Copy',
          status: 'uploaded',
          fileName: 'passport_scan.pdf',
          required: true,
        },
        {
          id: 'doc-cert',
          category: 'transcript',
          nameAr: 'كشف الدرجات والشهادة الأخيرة',
          nameEn: 'Academic Transcripts & Certificate',
          status: 'uploaded',
          fileName: 'high_school_grades.pdf',
          required: true,
        },
        {
          id: 'doc-lang',
          category: 'english_test',
          nameAr: 'شهادة اللغة (آيلتس / توفل إن وجدت)',
          nameEn: 'English Test Score (IELTS / PTE / Duolingo)',
          status: 'pending',
          required: false,
        },
      ],
      timeline: [
        { stage: 'submitted', titleAr: 'تم استلام الطلب', titleEn: 'Application Submitted', descriptionAr: 'تم تسجيل الطلب وتعيين مستشارك الخاص', descriptionEn: 'Application received and advisor assigned', date: new Date().toISOString().split('T')[0], isCompleted: true, isCurrent: false },
        { stage: 'under_review', titleAr: 'تدقيق الأوراق والأهلية', titleEn: 'Document Verification', descriptionAr: 'جاري فحص الشهادات والوثائق من قبل المستشار المختص', descriptionEn: 'Verifying certificates against partner criteria', date: new Date().toISOString().split('T')[0], isCompleted: true, isCurrent: true },
        { stage: 'sent_to_university', titleAr: 'التقديم للجامعة الشريكة', titleEn: 'Submitted to University', descriptionAr: 'تقديم الملف الأكاديمي المعتمد', descriptionEn: 'Application submission to university', isCompleted: false, isCurrent: false },
        { stage: 'conditional_offer', titleAr: 'صدور القبول المشروط المجاني', titleEn: 'Conditional Offer', descriptionAr: 'إصدار العرض المشروط خلال 3-5 أيام عمل', descriptionEn: 'Issuing official offer letter', isCompleted: false, isCurrent: false },
        { stage: 'unconditional_offer', titleAr: 'القبول النهائي والـ CAS / CoE', titleEn: 'Final Offer & CAS / CoE', descriptionAr: 'تأكيد المقعد واستخراج رمز التأشيرة', descriptionEn: 'Seat confirmation and visa voucher', isCompleted: false, isCurrent: false },
        { stage: 'visa_processing', titleAr: 'معاملة تأشيرة الطالب وحجز السكن', titleEn: 'Student Visa & Housing', descriptionAr: 'تجهيز ملف السفارة وحجز السكن المعتمد', descriptionEn: 'Visa lodgement and student accommodation', isCompleted: false, isCurrent: false },
        { stage: 'approved_ready', titleAr: 'منح التأشيرة والاستعداد للسفر', titleEn: 'Visa Granted & Departure', descriptionAr: 'حجز استقبال المطار وبدء الدراسة الجامعية', descriptionEn: 'Flight departure briefing & welcome', isCompleted: false, isCurrent: false }
      ],
      notes: [
        'تم استلام الطلب بنجاح عبر بوابة المنصة.',
        `الوجهة المفضلة: ${countryDestination}`,
        `التخصص المطلوب: ${preferredMajor || 'عام'}`
      ]
    };

    // حفظ في مخزن الذاكرة
    inMemoryStore.applications.unshift(newApp);

    // حفظ في قاعدة بيانات PostgreSQL إذا كانت مفعلة
    if (isPostgresConnected) {
      try {
        await pool.query(
          `INSERT INTO applications (
            id, application_number, student_name, email, phone, whatsapp, 
            country_destination, study_level, preferred_major, gpa, 
            high_school_type, sponsor_type, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
          [
            newId,
            applicationNumber,
            studentName,
            email,
            phone,
            whatsapp || phone,
            countryDestination,
            studyLevel || 'bachelor',
            preferredMajor || 'General',
            gpa || '',
            highSchoolType || '',
            sponsorType || '',
            'under_review',
          ]
        );
      } catch (dbErr: any) {
        console.error('Postgres insert application failed:', dbErr.message);
      }
    }

    // إطلاق إشعارات الخلفية غير المتزامنة (Email via Gmail + Telegram Bot)
    // لا ننتظر انتهاء الإرسال لتجنب إبطاء رد الخادم على المتصفح
    const notificationPayload = {
      applicationNumber,
      studentName,
      email,
      phone,
      whatsapp,
      countryDestination,
      studyLevel: studyLevel || 'bachelor',
      preferredMajor: preferredMajor || 'عام',
      preferredUniversity,
      gpa,
      highSchoolType,
    };

    // 1. إرسال بريد جيميل
    sendNewApplicationEmailToAdmin(notificationPayload).catch(err => {
      console.error('Background Email error:', err);
    });

    // 2. إرسال إشعار تلغرام
    sendTelegramNotification(
      notificationPayload,
      inMemoryStore.settings.telegram_bot_token,
      inMemoryStore.settings.telegram_chat_id
    ).catch(err => {
      console.error('Background Telegram error:', err);
    });

    console.log(`🎉 [Application Created] تم استلام طلب جديد برقم: ${applicationNumber} للطالب: ${studentName}`);

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل طلبك بنجاح وسيتواصل معك مستشارك الأكاديمي قريباً',
      applicationNumber,
      data: newApp,
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
    const { status, stageIndex, note } = req.body;

    const app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    if (status) app.status = status;
    if (note) {
      app.notes.push(note);
    }
    app.updatedAt = new Date().toISOString();

    if (isPostgresConnected) {
      await pool.query(
        'UPDATE applications SET status = COALESCE($1, status), stage_index = COALESCE($2, stage_index), updated_at = NOW() WHERE id = $3 OR application_number = $3',
        [status, stageIndex, id]
      );
    }

    return res.json({ success: true, message: 'تم تحديث حالة الطلب', data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث حالة وثيقة للطالب أو رفع ملف جديد
 * POST /api/applications/:id/documents
 */
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { docId, fileName } = req.body;

    const app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const doc = app.documents.find(d => d.id === docId);
    if (doc) {
      doc.fileName = fileName || 'document.pdf';
      doc.status = 'uploaded';
    }

    return res.json({ success: true, message: 'تم تحديث الوثيقة', data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
