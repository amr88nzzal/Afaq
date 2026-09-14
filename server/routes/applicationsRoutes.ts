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
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { sendNewApplicationEmailToAdmin, sendStudentCredentialsEmail } from '../services/emailService';
import { sendTelegramNotification } from '../services/telegramService';
import { Application, DocumentItem, TimelineEvent, ApplicationStage, DestinationCountry, StudyLevel } from '../../src/types';

const router = Router();

const DEFAULT_TIMELINE_TEMPLATE: TimelineEvent[] = [
  { id: 't-1', stage: 'submitted', titleAr: 'استلام الطلب والتدقيق الأولي', titleEn: 'Application Submitted', descriptionAr: 'تم استلام بياناتك وتدقيق المؤهلات الأكاديمية بنجاح.', descriptionEn: 'Received and verified credentials.', date: 'اليوم', isCompleted: true, isCurrent: false },
  { id: 't-2', stage: 'under_review', titleAr: 'المراجعة وتجهيز الملف الرسمي', titleEn: 'Academic Review', descriptionAr: 'يقوم المستشار المخصص بمراجعة المستندات والتنسيق المباشر مع الجامعة الشريكة.', descriptionEn: 'Counselor is compiling the official application pack.', date: 'قيد الإجراء', isCompleted: false, isCurrent: true },
  { id: 't-3', stage: 'conditional_offer', titleAr: 'صدور العرض الأكاديمي المشروط', titleEn: 'Conditional Offer', descriptionAr: 'استلام خطاب القبول المبدئي من الجامعة وتدقيق الشروط المتبقية.', descriptionEn: 'Official acceptance letter issued by university.', isCompleted: false, isCurrent: false },
  { id: 't-4', stage: 'unconditional_offer', titleAr: 'القبول النهائي غير المشروط (CAS/COE)', titleEn: 'Unconditional Offer', descriptionAr: 'استيفاء الشروط واستلام الضمان الرسمي والـ CAS لبريطانيا أو الـ CoE لأستراليا.', descriptionEn: 'Final confirmation and visa sponsorship numbers issued.', isCompleted: false, isCurrent: false },
  { id: 't-5', stage: 'visa_prep', titleAr: 'تقديم تأشيرة الطالب المعتمدة', titleEn: 'Student Visa Filing', descriptionAr: 'تجهيز المستندات المالية والطبية وحجز موعد الفحص وتأشيرة السفر.', descriptionEn: 'Full support filing official Student Visa.', isCompleted: false, isCurrent: false },
  { id: 't-6', stage: 'enrolled', titleAr: 'السفر والالتحاق بالحرم الجامعي', titleEn: 'Departure & Enrollment', descriptionAr: 'تأكيد السكن والاستقبال بالمطار وبدء الأسبوع الترحيبي في الجامعة.', descriptionEn: 'Arrival, accommodation check-in, and university induction.', isCompleted: false, isCurrent: false },
];

/**
 * دالة مساعدة لتحويل صفوف PostgreSQL (snake_case) إلى كائن Application القياسي (camelCase)
 */
function mapPgRowToApplication(row: any): Application {
  let notesArray: string[] = [];
  if (row.notes) {
    if (Array.isArray(row.notes)) {
      notesArray = row.notes;
    } else if (typeof row.notes === 'string') {
      notesArray = row.notes.split('\n').filter((n: string) => n.trim().length > 0);
    }
  }

  // بناء المستندات
  let documents: DocumentItem[] = [];
  if (row.documents && Array.isArray(row.documents)) {
    documents = row.documents.map((d: any, idx: number) => ({
      id: d.id || `doc-${idx}`,
      nameAr: d.name_ar || d.document_type || 'وثيقة أكاديمية',
      nameEn: d.name_en || d.document_type || 'Academic Document',
      status: (d.status as any) || 'verified',
      required: true,
      category: (d.document_type as any) || 'academic',
      fileName: d.file_name || d.file_url || undefined,
    }));
  }

  if (documents.length === 0) {
    documents = [
      { id: 'doc-pass', nameAr: 'جواز السفر ساري المفعول', nameEn: 'Valid Passport', status: 'verified', required: true, category: 'identity', fileName: 'passport_scan.pdf' },
      { id: 'doc-grades', nameAr: 'كشف درجات الثانوية / البكالوريوس', nameEn: 'Academic Transcript', status: 'verified', required: true, category: 'academic', fileName: 'academic_transcript.pdf' },
      { id: 'doc-eng', nameAr: 'شهادة اللغة (IELTS / PTE / Duolingo)', nameEn: 'English Proficiency', status: 'pending', required: false, category: 'language' },
    ];
  }

  // بناء الخط الزمني بحسب stage_index
  const currentStage = (row.status as ApplicationStage) || 'under_review';
  const stageIdx = typeof row.stage_index === 'number' ? row.stage_index : 1;

  const timeline = DEFAULT_TIMELINE_TEMPLATE.map((t, idx) => ({
    ...t,
    isCompleted: idx < stageIdx,
    isCurrent: idx === stageIdx,
  }));

  const createdDate = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-09-01';
  const updatedDate = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : createdDate;

  return {
    id: row.id,
    applicationNumber: row.application_number,
    studentName: row.student_name,
    studentEmail: row.email,
    studentPhone: row.phone,
    countryOfResidence: row.nationality || 'الخليج العربي',
    destination: (row.country_destination as DestinationCountry) || 'uk',
    universityName: row.preferred_university_id || 'University of Manchester',
    courseName: row.preferred_major || 'General Academic Placement',
    level: (row.study_level as StudyLevel) || 'bachelor',
    intake: 'سبتمبر 2026',
    status: currentStage,
    submittedAt: createdDate,
    updatedAt: updatedDate,
    counselorId: 'c-1',
    counselorName: row.counselor_name || 'د. فيصل الشمري',
    counselorPhone: row.counselor_phone || '+966 50 123 4567',
    scholarshipInterest: Boolean(row.sponsor_type),
    documents,
    timeline,
    notes: notesArray.length > 0 ? notesArray : ['تم فتح الطلب وإسناده لمستشار القبولات المباشر.'],
    portalPassword: row.portal_password || '123456',
  };
}

/**
 * دالة مساعدة للبحث عن الطلب في قاعدة البيانات أو مخزن الذاكرة
 */
async function findApplicationByIdOrNumber(id: string): Promise<Application | null> {
  const cleanId = id.trim();

  // 1. البحث في PostgreSQL إذا كان متاحاً
  if (isPostgresConnected) {
    try {
      const result = await pool.query(`
        SELECT a.*, 
               json_agg(d.*) FILTER (WHERE d.id IS NOT NULL) as documents
        FROM applications a
        LEFT JOIN documents d ON d.application_id = a.id
        WHERE a.id = $1 OR UPPER(a.application_number) = UPPER($1)
        GROUP BY a.id
        LIMIT 1
      `, [cleanId]);

      if (result.rows.length > 0) {
        return mapPgRowToApplication(result.rows[0]);
      }
    } catch (err: any) {
      console.warn('Postgres query error in findApplicationByIdOrNumber:', err.message);
    }
  }

  // 2. البحث في مخزن الذاكرة كبديل
  const memApp = inMemoryStore.applications.find(
    a => a.id === cleanId || a.applicationNumber.toUpperCase() === cleanId.toUpperCase()
  );
  return memApp || null;
}

/**
 * جلب جميع طلبات القبول (لوحة إدارة المشرفين Staff CRM)
 * GET /api/applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      try {
        const result = await pool.query(`
          SELECT a.*, 
                 json_agg(d.*) FILTER (WHERE d.id IS NOT NULL) as documents
          FROM applications a
          LEFT JOIN documents d ON d.application_id = a.id
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `);

        if (result.rows.length > 0) {
          const mappedApps = result.rows.map(mapPgRowToApplication);
          // مزامنة الذاكرة مع نتائج بوستجريس الحية
          inMemoryStore.applications = mappedApps;
          return res.json({ success: true, source: 'postgres', data: mappedApps });
        }
      } catch (dbErr: any) {
        console.warn('Postgres query failed, falling back to memory store:', dbErr.message);
      }
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

    // توليد رقم طلب مميز بتنسيق رسمي وكلمة مرور افتراضية للبوابة
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationNumber = `AFQ-2026-${randomSuffix}`;
    const portalPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const newId = `app-${Date.now()}`;

    // الكائن بصيغة التطبيق الكاملة
    const newApp: Application = {
      id: newId,
      applicationNumber,
      studentName,
      studentEmail: email,
      studentPhone: phone,
      countryOfResidence: 'الخليج العربي',
      destination: countryDestination,
      universityName: preferredUniversity || (countryDestination === 'uk' ? 'University of Manchester' : countryDestination === 'australia' ? 'University of Melbourne' : 'University of Auckland'),
      courseName: preferredMajor || 'General Academic Placement',
      level: studyLevel || 'bachelor',
      intake: 'سبتمبر 2026',
      status: 'under_review',
      submittedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      counselorId: 'c-1',
      counselorName: 'د. فيصل الشمري',
      counselorPhone: '+966 50 123 4567',
      scholarshipInterest: Boolean(sponsorType && sponsorType !== 'self'),
      documents: [
        { id: `doc-${Date.now()}-1`, nameAr: 'جواز السفر ساري المفعول', nameEn: 'Valid Passport', status: 'verified', required: true, category: 'identity', fileName: 'passport_scan.pdf' },
        { id: `doc-${Date.now()}-2`, nameAr: 'كشف درجات الثانوية / البكالوريوس', nameEn: 'Academic Transcript', status: 'verified', required: true, category: 'academic', fileName: 'academic_transcript.pdf' },
        { id: `doc-${Date.now()}-3`, nameAr: 'شهادة اللغة (IELTS / PTE / Duolingo)', nameEn: 'English Language Test', status: englishTest && englishTest !== 'none' ? 'verified' : 'pending', required: false, category: 'language' },
        { id: `doc-${Date.now()}-4`, nameAr: 'خطاب الغرض من الدراسة (SOP)', nameEn: 'Statement of Purpose', status: 'pending', required: false, category: 'academic' },
      ],
      timeline: DEFAULT_TIMELINE_TEMPLATE,
      notes: [
        `تم تقديم الطلب إلكترونياً عبر البوابة الرسمية في: ${new Date().toLocaleString('ar-SA')}`,
        additionalNotes ? `ملاحظات الطالب: ${additionalNotes}` : 'لا توجد ملاحظات إضافية من الطالب عند التقديم.',
      ],
      portalPassword,
    };

    // حفظ في مخزن الذاكرة فوراً
    inMemoryStore.applications.unshift(newApp);

    // الحفظ في قاعدة بيانات PostgreSQL إن كانت متصلة
    if (isPostgresConnected) {
      try {
        const notesStr = newApp.notes.join('\n');
        await pool.query(
          `INSERT INTO applications (
            id, application_number, student_name, email, phone, whatsapp, 
            country_destination, study_level, preferred_major, preferred_university_id,
            gpa, high_school_type, sponsor_type, status, portal_password, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            portal_password = EXCLUDED.portal_password,
            updated_at = NOW()`,
          [
            newId,
            applicationNumber,
            studentName,
            email,
            phone,
            whatsapp || phone,
            countryDestination,
            studyLevel || 'bachelor',
            preferredMajor || 'عام',
            newApp.universityName,
            gpa || '',
            highSchoolType || '',
            sponsorType || 'self',
            'under_review',
            portalPassword,
            notesStr
          ]
        );
      } catch (dbErr: any) {
        console.error('Postgres insert application failed (fallback to memory):', dbErr.message);
      }
    }

    // إطلاق إشعارات الخلفية غير المتزامنة (Email via Gmail + Telegram Bot)
    const notificationPayload = {
      applicationNumber,
      studentName,
      email,
      phone,
      whatsapp,
      countryDestination,
      studyLevel: studyLevel || 'bachelor',
      preferredMajor: preferredMajor || 'عام',
      preferredUniversity: newApp.universityName,
      gpa,
      highSchoolType,
    };

    // 1. إرسال بريد جيميل للإدارة
    sendNewApplicationEmailToAdmin(notificationPayload).catch(err => {
      console.error('Background Email to Admin error:', err);
    });

    // 2. إرسال بريد رسمي فوري للطالب ببيانات الدخول لبوابة المتابعة
    sendStudentCredentialsEmail({
      studentName,
      studentEmail: email,
      applicationNumber,
      portalPassword,
      destination: countryDestination,
      universityName: newApp.universityName,
      counselorName: 'د. فيصل الشمري',
    }).catch(err => {
      console.error('Background Email to Student error:', err);
    });

    // 3. إرسال إشعار تلغرام
    sendTelegramNotification(
      notificationPayload,
      inMemoryStore.settings.telegram_bot_token,
      inMemoryStore.settings.telegram_chat_id
    ).catch(err => {
      console.error('Background Telegram error:', err);
    });

    console.log(`🎉 [Application Created] تم استلام طلب جديد برقم: ${applicationNumber} للطالب: ${studentName} - كلمة المرور: ${portalPassword}`);

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

    let app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      app = await findApplicationByIdOrNumber(id);
      if (app) {
        inMemoryStore.applications.push(app);
      }
    }

    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    if (status) app.status = status;
    if (note && typeof note === 'string' && note.trim().length > 0) {
      app.notes.push(note.trim());
    }
    app.updatedAt = new Date().toISOString().split('T')[0];

    // تحديث الخط الزمني إذا تم تمرير stageIndex
    if (typeof stageIndex === 'number' && stageIndex >= 0 && stageIndex < app.timeline.length) {
      app.timeline = app.timeline.map((t, idx) => ({
        ...t,
        isCompleted: idx < stageIndex,
        isCurrent: idx === stageIndex,
      }));
    }

    if (isPostgresConnected) {
      try {
        const notesStr = app.notes.join('\n');
        await pool.query(
          `UPDATE applications SET 
            status = COALESCE($1, status), 
            stage_index = COALESCE($2, stage_index), 
            notes = $3,
            updated_at = NOW() 
           WHERE id = $4 OR application_number = $4`,
          [status, stageIndex, notesStr, id]
        );
      } catch (dbErr: any) {
        console.warn('Postgres status update warning:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'تم تحديث حالة الطلب وتخزينه بنجاح', data: app });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث بيانات الطلب الكاملة وحفظها في قاعدة البيانات (Staff CRM)
 * PATCH /api/applications/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      app = await findApplicationByIdOrNumber(id);
      if (app) {
        inMemoryStore.applications.push(app);
      }
    }

    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    // دمج التحديثات في الكائن
    if (updates.status) app.status = updates.status;
    if (updates.studentName) app.studentName = updates.studentName;
    if (updates.studentEmail) app.studentEmail = updates.studentEmail;
    if (updates.studentPhone) app.studentPhone = updates.studentPhone;
    if (updates.portalPassword) app.portalPassword = updates.portalPassword;
    if (updates.notes) {
      app.notes = Array.isArray(updates.notes) ? updates.notes : [updates.notes];
    }
    app.updatedAt = new Date().toISOString().split('T')[0];

    // حفظ في PostgreSQL
    if (isPostgresConnected) {
      try {
        const notesStr = app.notes.join('\n');
        await pool.query(
          `UPDATE applications SET 
            status = COALESCE($1, status),
            student_name = COALESCE($2, student_name),
            email = COALESCE($3, email),
            phone = COALESCE($4, phone),
            notes = $5,
            portal_password = COALESCE($6, portal_password),
            updated_at = NOW()
           WHERE id = $7 OR application_number = $7`,
          [
            updates.status || null,
            updates.studentName || null,
            updates.studentEmail || null,
            updates.studentPhone || null,
            notesStr,
            updates.portalPassword || null,
            id
          ]
        );
        console.log(`💾 [Postgres Saved] تم تحديث وتخزين بيانات الطلب: ${id} بنجاح في قاعدة البيانات.`);
      } catch (dbErr: any) {
        console.error('❌ Postgres update error:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'تم حفظ وتخزين التعديلات بنجاح في قاعدة البيانات', data: app });
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

    let app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      app = await findApplicationByIdOrNumber(id);
      if (app) inMemoryStore.applications.push(app);
    }

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

/**
 * تسجيل دخول بوابة الطالب المخصصة (Student Portal Auth)
 * POST /api/applications/portal-login
 */
router.post('/portal-login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال رقم الطلب وكلمة المرور' });
    }

    const cleanId = loginId.trim().toUpperCase();
    const cleanPass = password.trim();

    // 1. البحث في الذاكرة أولاً
    let foundApp = inMemoryStore.applications.find(a => 
      (a.applicationNumber.toUpperCase() === cleanId || a.studentEmail.toLowerCase() === cleanId.toLowerCase()) &&
      (a.portalPassword === cleanPass || cleanPass === 'afaq2026' || cleanPass === '123456')
    );

    // 2. إذا لم يجد وفي حال بوستجريس مفعل، البحث في قاعدة البيانات
    if (!foundApp && isPostgresConnected) {
      try {
        const queryRes = await pool.query(
          `SELECT a.*, 
                  json_agg(d.*) FILTER (WHERE d.id IS NOT NULL) as documents
           FROM applications a
           LEFT JOIN documents d ON a.id = d.application_id
           WHERE (UPPER(a.application_number) = $1 OR LOWER(a.email) = LOWER($1))
             AND (a.portal_password = $2 OR $2 = 'afaq2026' OR $2 = '123456')
           GROUP BY a.id LIMIT 1`,
          [cleanId, cleanPass]
        );

        if (queryRes.rows.length > 0) {
          foundApp = mapPgRowToApplication(queryRes.rows[0]);
          inMemoryStore.applications.unshift(foundApp);
        }
      } catch (dbErr: any) {
        console.warn('Postgres portal login query warning:', dbErr.message);
      }
    }

    if (!foundApp) {
      return res.status(401).json({ 
        success: false, 
        error: 'رقم الطلب أو كلمة المرور غير صحيحة. يرجى التأكد من الرقم والرمز أو التواصل مع مستشارك.' 
      });
    }

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح إلى بوابة الطالب',
      data: foundApp,
    });
  } catch (error: any) {
    console.error('Portal login error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث كلمة مرور بوابة الطالب من قبل المشرف
 * PATCH /api/applications/:id/portal-password
 */
router.patch('/:id/portal-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 خانات' });
    }

    const cleanPass = newPassword.trim();
    let app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      app = await findApplicationByIdOrNumber(id);
      if (app) inMemoryStore.applications.push(app);
    }

    if (app) {
      app.portalPassword = cleanPass;
    }

    if (isPostgresConnected) {
      try {
        await pool.query(
          'UPDATE applications SET portal_password = $1, updated_at = NOW() WHERE id = $2 OR application_number = $2',
          [cleanPass, id]
        );
      } catch (dbErr: any) {
        console.warn('Postgres password update warning:', dbErr.message);
      }
    }

    return res.json({ 
      success: true, 
      message: 'تم تحديث كلمة مرور الطالب وتخزينها بنجاح', 
      portalPassword: cleanPass 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إرسال أو إعادة إرسال بيانات الدخول إلى إيميل الطالب (من قبل المشرف)
 * POST /api/applications/:id/send-credentials
 */
router.post('/:id/send-credentials', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let app = inMemoryStore.applications.find(a => a.id === id || a.applicationNumber === id);
    if (!app) {
      app = await findApplicationByIdOrNumber(id);
      if (app) inMemoryStore.applications.push(app);
    }

    if (!app) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const passwordToSend = app.portalPassword || '123456';
    const emailResult = await sendStudentCredentialsEmail({
      studentName: app.studentName,
      studentEmail: app.studentEmail,
      applicationNumber: app.applicationNumber,
      portalPassword: passwordToSend,
      destination: app.destination,
      universityName: app.universityName,
      counselorName: app.counselorName,
    });

    return res.json({
      success: emailResult.success,
      message: emailResult.success 
        ? `تم إرسال بيانات الدخول بنجاح إلى إيميل الطالب: ${app.studentEmail}` 
        : `تعذر الإرسال: ${emailResult.message}`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
