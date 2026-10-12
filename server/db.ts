import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { hashPassword, LOCKED_PASSWORD } from './services/passwordService';

dotenv.config();

const { Pool } = pg;

/**
 * ⛔ أُزيلت كلمة مرور قاعدة البيانات المثبتة في الكود.
 * كانت القيمة الافتراضية `postgres://afaq_user:ChangeMeSecurePassword123@...`
 * مكتوبة هنا وفي .env.example، وهي مكشوفة للعامة في المستودع.
 * الآن: إما DATABASE_URL من متغيّرات البيئة، أو العمل بنظام الذاكرة المتكامل.
 */
const databaseUrl = process.env.DATABASE_URL || '';

/**
 * التحقق من شهادة TLS لقاعدة البيانات.
 * كان `rejectUnauthorized: false` دائماً عند تفعيل SSL، وهو ما يسمح
 * بهجوم رجل-في-المنتصف على اتصال قاعدة البيانات.
 * الآن: التحقق مُفعَّل افتراضياً، ويمكن تعطيله صراحةً لبيئات التطوير فقط.
 */
const pgSsl =
  process.env.PG_SSL === 'true'
    ? {
        rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
        ...(process.env.PG_SSL_CA ? { ca: process.env.PG_SSL_CA } : {}),
      }
    : false;

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: pgSsl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isPostgresConnected = false;

// Fallback in-memory database store synced with SQL seed
export const inMemoryStore = {
  countries: [
    { id: 1, code: 'uk', name_ar: 'المملكة المتحدة', name_en: 'United Kingdom', info_ar: 'وجهة التعليم العالي الأولى عالمياً بتراث أكاديمي عريق.', info_en: 'The premier global higher education destination.', image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', is_active: true },
    { id: 2, code: 'australia', name_ar: 'أستراليا', name_en: 'Australia', info_ar: 'بيئة دراسية عالمية متطورة مع فرص تدريب وإقامة.', info_en: 'World-class innovative education environment.', image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80', is_active: true },
    { id: 3, code: 'nz', name_ar: 'نيوزيلندا', name_en: 'New Zealand', info_ar: 'جودة تعليم رفيعة وأمان بيئي متميز.', info_en: 'Highest academic standards in a safe, scenic environment.', image_url: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80', is_active: true },
    { id: 4, code: 'usa', name_ar: 'الولايات المتحدة', name_en: 'United States', info_ar: 'أكبر تنوع في التخصصات والأبحاث الرائدة عالمياً.', info_en: 'Unrivaled academic diversity and research leadership.', image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80', is_active: true },
    { id: 5, code: 'canada', name_ar: 'كندا', name_en: 'Canada', info_ar: 'تعليم رائد عالمياً وتسهيلات واسعة للإقامة والعمل.', info_en: 'World-leading education with generous immigration pathways.', image_url: 'https://images.unsplash.com/photo-1517935703635-27c946452995?auto=format&fit=crop&w=800&q=80', is_active: true },
  ],
  universities: [
    { id: 1, country_id: 1, country_name_ar: 'المملكة المتحدة', country_name_en: 'United Kingdom', name_ar: 'جامعة مانشستر', name_en: 'University of Manchester', city_ar: 'مانشستر', city_en: 'Manchester', details_ar: 'عضو مجموعة راسل المرموقة وحائزة على 25 جائزة نوبل.', details_en: 'Prestigious Russell Group member with 25 Nobel laureates.', cost_info: '£24,000 - £34,000 / سنوياً', ranking: 27, acceptance_rate: '56%', featured: true, website_url: 'https://www.manchester.ac.uk', image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80' },
    { id: 2, country_id: 1, country_name_ar: 'المملكة المتحدة', country_name_en: 'United Kingdom', name_ar: 'جامعة إدنبرة', name_en: 'University of Edinburgh', city_ar: 'إدنبرة', city_en: 'Edinburgh', details_ar: 'واحدة من أعرق جامعات العالم منذ عام 1583، رائدة في الطب والذكاء الاصطناعي.', details_en: 'Historic Scottish ancient university founded in 1583.', cost_info: '£23,000 - £35,000 / سنوياً', ranking: 15, acceptance_rate: '42%', featured: true, website_url: 'https://www.ed.ac.uk', image_url: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80' },
    { id: 3, country_id: 1, country_name_ar: 'المملكة المتحدة', country_name_en: 'United Kingdom', name_ar: 'جامعة بريستول', name_en: 'University of Bristol', city_ar: 'بريستول', city_en: 'Bristol', details_ar: 'جامعة بحثية كبرى تحتل المرتبة الأولى في استقطاب الخريجين.', details_en: 'Top research power Russell Group university.', cost_info: '£22,000 - £31,000 / سنوياً', ranking: 55, acceptance_rate: '67%', featured: false, website_url: 'https://www.bristol.ac.uk', image_url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80' },
    { id: 4, country_id: 2, country_name_ar: 'أستراليا', country_name_en: 'Australia', name_ar: 'جامعة ملبورن', name_en: 'University of Melbourne', city_ar: 'ملبورن', city_en: 'Melbourne', details_ar: 'الجامعة الأولى في أستراليا وأبرز مراكز الأبحاث الدولية.', details_en: 'Ranked #1 university in Australia.', cost_info: 'AUD 38,000 - 48,000 / سنوياً', ranking: 14, acceptance_rate: '70%', featured: true, website_url: 'https://www.unimelb.edu.au', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80' },
    { id: 5, country_id: 2, country_name_ar: 'أستراليا', country_name_en: 'Australia', name_ar: 'جامعة سيدني', name_en: 'University of Sydney', city_ar: 'سيدني', city_en: 'Sydney', details_ar: 'أول جامعة في أستراليا بحرم جامعي أيقوني وتميز عالمي.', details_en: "Australia's first university with global distinction.", cost_info: 'AUD 40,000 - 52,000 / سنوياً', ranking: 19, acceptance_rate: '30%', featured: true, website_url: 'https://www.sydney.edu.au', image_url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80' },
    { id: 6, country_id: 3, country_name_ar: 'نيوزيلندا', country_name_en: 'New Zealand', name_ar: 'جامعة أوكلاند', name_en: 'University of Auckland', city_ar: 'أوكلاند', city_en: 'Auckland', details_ar: 'الجامعة الأكبر والأعلى تصنيفاً في نيوزيلندا.', details_en: "New Zealand's highest-ranked and largest university.", cost_info: 'NZD 34,000 - 46,000 / سنوياً', ranking: 68, acceptance_rate: '72%', featured: true, website_url: 'https://www.auckland.ac.nz', image_url: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=800&q=80' },
  ],
  majors: [
    { id: 1, university_id: 1, name_ar: 'علوم الحاسب والذكاء الاصطناعي', name_en: 'BSc Computer Science & Artificial Intelligence', category: 'computing', degree_level: 'bachelor', duration: '3 سنوات', annual_tuition: '£29,000' },
    { id: 2, university_id: 1, name_ar: 'إدارة الأعمال الدولية والمالية', name_en: 'BSc International Business & Finance', category: 'business', degree_level: 'bachelor', duration: '3 سنوات', annual_tuition: '£27,500' },
    { id: 3, university_id: 1, name_ar: 'الهندسة الميكانيكية المتقدمة', name_en: 'BEng Mechanical Engineering', category: 'engineering', degree_level: 'bachelor', duration: '3-4 سنوات', annual_tuition: '£30,000' },
    { id: 4, university_id: 2, name_ar: 'الطب البشري والجراحة', name_en: 'MBChB Medicine', category: 'medicine', degree_level: 'bachelor', duration: '5 سنوات', annual_tuition: '£35,000' },
    { id: 5, university_id: 2, name_ar: 'علم البيانات والمعلوماتية الحيوية', name_en: 'MSc Data Science', category: 'computing', degree_level: 'master', duration: 'سنة واحدة', annual_tuition: '£28,000' },
    { id: 6, university_id: 4, name_ar: 'هندسة البرمجيات والأنظمة الذكية', name_en: 'Bachelor of Software Engineering', category: 'computing', degree_level: 'bachelor', duration: '4 سنوات', annual_tuition: 'AUD 46,000' },
    { id: 7, university_id: 5, name_ar: 'ماجستير إدارة الأعمال الدولي', name_en: 'Master of Commerce & MBA', category: 'business', degree_level: 'master', duration: '1.5-2 سنة', annual_tuition: 'AUD 49,000' },
    { id: 8, university_id: 6, name_ar: 'الهندسة المدنية والبيئية', name_en: 'BE (Hons) Civil Engineering', category: 'engineering', degree_level: 'bachelor', duration: '4 سنوات', annual_tuition: 'NZD 42,000' },
  ],
  users: [
    { id: 1, name: 'د. فيصل الشمري', email: 'faisal@afaq-global.amrodev.com', phone: '+966 50 123 4567', role: 'admin', telegram_id: '@dr_faisal_afaq', is_active: true },
    { id: 2, 'name': 'أ. سارة المنصور', email: 'sara@afaq-global.amrodev.com', phone: '+966 55 987 6543', role: 'counselor', telegram_id: '@sara_admissions', is_active: true },
    { id: 3, name: 'م. ريان القحطاني', email: 'rayan@afaq-global.amrodev.com', phone: '+966 54 321 0987', role: 'counselor', telegram_id: '@rayan_uk', is_active: true },
  ],
  customers: [
    { id: 1, name: 'عبدالرحمن محمد العتيبي', email: 'abdulrahman.o@example.com', phone: '+966 50 111 2233', whatsapp: '+966 50 111 2233', password_hash: LOCKED_PASSWORD, nationality: 'Saudi', current_status: 'active' },
    { id: 2, name: 'نورة عبدالله السديري', email: 'noura.s@example.com', phone: '+966 55 444 5566', whatsapp: '+966 55 444 5566', password_hash: LOCKED_PASSWORD, nationality: 'Saudi', current_status: 'active' },
    { id: 3, name: 'خالد فهد الشمري', email: 'khaled.f@example.com', phone: '+965 99 888 777', whatsapp: '+965 99 888 777', password_hash: LOCKED_PASSWORD, nationality: 'Kuwaiti', current_status: 'active' },
  ],
  applications: [
    {
      id: 1,
      application_number: 'AFQ-2026-8812',
      customer_id: 1,
      customer_name: 'عبدالرحمن محمد العتيبي',
      customer_email: 'abdulrahman.o@example.com',
      customer_phone: '+966 50 111 2233',
      university_id: 1,
      university_name_ar: 'جامعة مانشستر',
      university_name_en: 'University of Manchester',
      major_id: 1,
      major_name_ar: 'علوم الحاسب والذكاء الاصطناعي',
      major_name_en: 'BSc Computer Science & Artificial Intelligence',
      country_id: 1,
      country_name_ar: 'المملكة المتحدة',
      country_name_en: 'United Kingdom',
      staff_id: 1,
      staff_name: 'د. فيصل الشمري',
      study_level: 'bachelor',
      intake_season: 'سبتمبر 2026',
      sponsor_type: 'government',
      gpa: '3.92 / 4.00',
      status: 'under_review',
      notes: 'طالب متميز متقدم لبرنامج خادم الحرمين الشريفين للابتعاث الخارجي.',
      portal_password: LOCKED_PASSWORD,
      created_at: new Date().toISOString(),
      documents: [
        { id: 1, doc_type: 'passport', name_ar: 'جواز السفر ساري المفعول', name_en: 'Valid Passport', status: 'verified', fileName: 'passport_abdulrahman.pdf', fileSize: '2.1 MB', file_url: '/uploads/passports/app1_passport.pdf', uploadedAt: '2026-09-10' },
        { id: 2, doc_type: 'transcript', name_ar: 'كشف درجات الثانوية المعتمد', name_en: 'Academic Transcript', status: 'verified', fileName: 'transcript_certified.pdf', fileSize: '3.4 MB', file_url: '/uploads/transcripts/app1_transcript.pdf', uploadedAt: '2026-09-10' },
        { id: 3, doc_type: 'english_test', name_ar: 'شهادة اختبار اللغة (IELTS 7.0)', name_en: 'English Proficiency Test', status: 'verified', fileName: 'ielts_academic_7.0.pdf', fileSize: '1.1 MB', file_url: '/uploads/english/app1_ielts.pdf', uploadedAt: '2026-09-11' },
        { id: 4, doc_type: 'sop', name_ar: 'خطاب الغرض من الدراسة (SOP)', name_en: 'Statement of Purpose', status: 'pending', file_url: null }
      ],
      messages: [
        { id: 1, sender_type: 'user', sender_name: 'د. فيصل الشمري', message_text: 'مرحباً عبدالرحمن، تم استلام أوراقك وإرسالها للملحقية الأكاديمية.', is_internal_note: false, sent_at: new Date().toISOString() }
      ]
    },
    {
      id: 2,
      application_number: 'AFQ-2026-4421',
      customer_id: 2,
      customer_name: 'نورة عبدالله السديري',
      customer_email: 'noura.s@example.com',
      customer_phone: '+966 55 444 5566',
      university_id: 2,
      university_name_ar: 'جامعة إدنبرة',
      university_name_en: 'University of Edinburgh',
      major_id: 4,
      major_name_ar: 'الطب البشري والجراحة',
      major_name_en: 'MBChB Medicine',
      country_id: 1,
      country_name_ar: 'المملكة المتحدة',
      country_name_en: 'United Kingdom',
      staff_id: 2,
      staff_name: 'أ. سارة المنصور',
      study_level: 'bachelor',
      intake_season: 'سبتمبر 2026',
      sponsor_type: 'self',
      gpa: '98.5%',
      status: 'conditional_offer',
      notes: 'تم الحصول على قبول مشروط بدرجة الآيلتس (المطلوب 6.5).',
      portal_password: LOCKED_PASSWORD,
      created_at: new Date().toISOString(),
      documents: [
        { id: 5, doc_type: 'passport', name_ar: 'جواز السفر ساري المفعول', name_en: 'Valid Passport', status: 'verified', file_url: '/uploads/passports/app2_passport.pdf' },
        { id: 6, doc_type: 'transcript', name_ar: 'كشف درجات الثانوية', name_en: 'Academic Transcript', status: 'verified', file_url: '/uploads/transcripts/app2_transcript.pdf' },
        { id: 7, doc_type: 'english_test', name_ar: 'شهادة الآيلتس', name_en: 'English Language Test', status: 'missing', file_url: null }
      ],
      messages: []
    }
  ],
  meetings: [
    {
      id: 1,
      customer_id: 1,
      staff_id: 1,
      customer_name: 'عبدالرحمن محمد العتيبي',
      customer_email: 'abdulrahman.o@example.com',
      customer_phone: '+966 50 111 2233',
      destination_country: 'المملكة المتحدة',
      meeting_date: '2026-09-20',
      meeting_time: '14:00',
      meeting_type: 'video',
      status: 'scheduled',
      meeting_link: 'https://meet.google.com/afq-counsel-uk',
      notes: 'استشارة حول شروط القبول ومتطلبات منحة الابتعاث لجامعة مانشستر.'
    },
    {
      id: 2,
      customer_id: 2,
      staff_id: 2,
      customer_name: 'نورة عبدالله السديري',
      customer_email: 'noura.s@example.com',
      customer_phone: '+966 55 444 5566',
      destination_country: 'المملكة المتحدة',
      meeting_date: '2026-09-22',
      meeting_time: '16:30',
      meeting_type: 'video',
      status: 'scheduled',
      meeting_link: 'https://meet.google.com/afq-counsel-edin',
      notes: 'مناقشة تحضيرات اختبار الآيلتس والمقابلة الشخصية للطب في إدنبرة.'
    }
  ],
  paragraphs: [
    { id: 1, slug: 'hero_main', section_name: 'الرئيسية', title_ar: 'العنوان الرئيسي', title_en: 'Hero Title', text_ar: 'بوابتك المعتمدة للقبول الجامعي في بريطانيا، أستراليا ونيوزيلندا', text_en: 'Your Certified Gateway to Premier UK, Australian & New Zealand Universities' },
    { id: 2, slug: 'hero_sub', section_name: 'الرئيسية', title_ar: 'الوصف الترويجي', title_en: 'Hero Subtitle', text_ar: 'قبولك الجامعي مجاناً 100% وبدون أي أتعاب وكالة. تمثيل رسمي ومعتمد لأعرق الجامعات العالمية.', text_en: '100% Free Placement with Zero Agency Fees. Official and Certified Representative.' },
    { id: 3, slug: 'why_us', section_name: 'عن آفاق', title_ar: 'لماذا آفاق العالمية؟', title_en: 'Why Choose Afaq?', text_ar: 'نمتلك شراكات رسمية مباشرة مع كبرى الجامعات ونضمن للطالب التوجيه الأكاديمي السليم واستخراج القبولات خلال وقت قياسي.', text_en: 'We hold direct official agency agreements with prestigious universities, securing your offers in record time.' },
    { id: 4, slug: 'announcement', section_name: 'التنبيهات', title_ar: 'شريط التنبيهات العلوي', title_en: 'Top Announcement Bar', text_ar: 'التسجيل مفتوح الآن للفصل الدراسي 2026/2027 مع منح تفوق تصل حتى 40% من الرسوم الدراسية', text_en: 'Admissions now open for 2026/2027 intakes with merit scholarships up to 40% tuition reduction' }
  ],
  settings: {
    company_name_ar: '*** آفاق العالمية للخدمات التعليمية والقبولات الجامعية',
    company_name_en: 'Afaq Global Education & University Placements',
    company_phone: '+61468827480',
    company_whatsapp: '+491556009968',
    company_email: 'afaq@amrodev.com',
    support_email: 'support@amrodev.com',
    company_address_ar: 'استراليا - سيدني - شارع الحرية 15',
    company_address_en: 'Australia - Sydney - 15 Liberty Street',
    working_hours_ar: 'الأحد إلى الخميس: 9:00 صباحاً - 6:00 مساءً (توقيت مكة)',
    working_hours_en: 'Sunday to Thursday: 9:00 AM - 6:00 PM (GMT+3)',
    hero_title_ar: 'بوابتك المعتمدة للقبول الجامعي في بريطانيا، أستراليا ونيوزيلندا',
    hero_title_en: 'Your Certified Gateway to Premier UK, Australian & New Zealand Universities',
    hero_subtitle_ar: 'قبولك الجامعي مجاناً 100% وبدون أي أتعاب وكالة. تمثيل رسمي ومعتمد لأعرق الجامعات العالمية.',
    hero_subtitle_en: '100% Free Placement with Zero Agency Fees. Official and Certified Representative of Leading World Universities.',
    announcement_banner_ar: 'التسجيل مفتوح الآن للفصل الدراسي 2026/2027 مع منح تفوق تصل حتى 40% من الرسوم الدراسية',
    announcement_banner_en: 'Admissions now open for 2026/2027 intakes with merit scholarships up to 40% tuition reduction',
    admin_notification_email: 'admin@amrodev.com, amr.nzzal@gmail.com',
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID || '',
  } as Record<string, string>,
};

const storeFilePath = path.join(process.cwd(), 'server', 'data', 'store.json');

export function saveStoreToDisk(): void {
  try {
    const dir = path.dirname(storeFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storeFilePath, JSON.stringify(inMemoryStore, null, 2), 'utf8');
  } catch (err: any) {
    console.error('⚠️ [Store] Error writing store to disk:', err.message);
  }
}

export function loadStoreFromDisk(): void {
  try {
    if (fs.existsSync(storeFilePath)) {
      const data = fs.readFileSync(storeFilePath, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.applications)) {
        Object.assign(inMemoryStore, parsed);
        console.log(`📦 [Store] Successfully loaded ${parsed.applications.length} persisted applications from server disk.`);
      }
    }
  } catch (err: any) {
    console.error('⚠️ [Store] Error reading store from disk:', err.message);
  }
}

// Automatically load store from disk on startup
loadStoreFromDisk();

export async function testDbConnection(): Promise<boolean> {
  // لا يوجد DATABASE_URL — نعمل بنظام الذاكرة المتكامل بدل محاولة اتصال بلا إعداد
  if (!databaseUrl) {
    isPostgresConnected = false;
    console.warn('ℹ️ [Database] لم يتم ضبط DATABASE_URL — يعمل النظام بالذاكرة المتكاملة المحفوظة على القرص.');
    return false;
  }
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    
    // تنفيذ ملف init.sql لتأسيس الجداول والبيانات لأول مرة فقط إن لم تكن موجودة
    const checkTable = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications')");
    const tablesExist = checkTable.rows[0]?.exists;

    if (!tablesExist) {
      const initSqlPath = path.join(process.cwd(), 'server', 'db', 'init.sql');
      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        await client.query(initSql);
        console.log('✅ [Database] تم تنفيذ init.sql وتأسيس الجداول والبيانات لأول مرة بنجاح');
      }
    } else {
      console.log('✅ [Database] الجداول والبيانات الحالية موجودة ومحفوظة مسبقاً في PostgreSQL ولم يتم مسح البيانات.');
    }

    // تحديث وتعديل الهيكل لتوسيع الأعمدة (Migrations)
    try {
      await client.query(`
        ALTER TABLE documents ALTER COLUMN file_url TYPE TEXT;
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size VARCHAR(50);
      `);
      console.log('✅ [Database] Schema updated: file_url column set to TEXT and file details added.');
    } catch (migErr: any) {
      console.log('ℹ️ [Database] Migration note:', migErr.message);
    }

    // ترحيل: تحويل أي كلمة مرور مخزّنة كنص صريح إلى "مقفل" حتى تُعاد تهيئتها بأمان.
    // لا يمكن تحويل النص الصريح إلى بصمة تلقائياً لأننا لا نعرف كلمة المرور الأصلية،
    // وقبولها كما هي يعني إبقاء الاعتماد على كلمة مرور مكشوفة في المستودع.
    try {
      const legacyUsers = await client.query(
        `SELECT COUNT(*)::int AS n FROM users
         WHERE password_hash IS NOT NULL AND password_hash <> $1 AND password_hash NOT LIKE 'scrypt$%'`,
        [LOCKED_PASSWORD]
      );
      const legacyCustomers = await client.query(
        `SELECT COUNT(*)::int AS n FROM customers
         WHERE password_hash IS NOT NULL AND password_hash <> $1 AND password_hash NOT LIKE 'scrypt$%'`,
        [LOCKED_PASSWORD]
      );
      const legacyCount = (legacyUsers.rows[0]?.n || 0) + (legacyCustomers.rows[0]?.n || 0);
      if (legacyCount > 0) {
        await client.query(
          `UPDATE users SET password_hash = $1
           WHERE password_hash IS NOT NULL AND password_hash <> $1 AND password_hash NOT LIKE 'scrypt$%'`,
          [LOCKED_PASSWORD]
        );
        await client.query(
          `UPDATE customers SET password_hash = $1
           WHERE password_hash IS NOT NULL AND password_hash <> $1 AND password_hash NOT LIKE 'scrypt$%'`,
          [LOCKED_PASSWORD]
        );
        console.log(`🔐 [Database] تم قفل ${legacyCount} حساباً كانت كلماته مخزّنة كنص صريح — يجب إعادة تعيينها.`);
      }
    } catch (legacyErr: any) {
      console.warn('ℹ️ [Database] تعذّر فحص كلمات المرور القديمة:', legacyErr.message);
    }

    // تهيئة كلمة مرور المدير الأول من متغيّر البيئة (تُستخدم مرة واحدة فقط)
    try {
      const bootstrapPassword = process.env.INITIAL_ADMIN_PASSWORD;
      if (bootstrapPassword && bootstrapPassword.length >= 8) {
        const lockedAdmin = await client.query(
          `SELECT id, email FROM users
           WHERE role = 'admin' AND password_hash = $1
           ORDER BY id ASC LIMIT 1`,
          [LOCKED_PASSWORD]
        );
        if (lockedAdmin.rows.length > 0) {
          const adminHash = await hashPassword(bootstrapPassword);
          await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
            adminHash,
            lockedAdmin.rows[0].id,
          ]);
          console.log(`🔐 [Database] تم ضبط كلمة مرور المدير الأول (${lockedAdmin.rows[0].email}) من INITIAL_ADMIN_PASSWORD`);
        }
      } else {
        const lockedAdmins = await client.query(
          `SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND password_hash = $1`,
          [LOCKED_PASSWORD]
        );
        if ((lockedAdmins.rows[0]?.n || 0) > 0) {
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.warn('⚠️  يوجد حساب مدير مقفل بلا كلمة مرور.');
          console.warn('👉  اضبط INITIAL_ADMIN_PASSWORD في ملف .env (8 أحرف على الأقل) ثم أعد تشغيل الخادم.');
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
      }
    } catch (bootErr: any) {
      console.warn('ℹ️ [Database] تعذّر ضبط كلمة مرور المدير الأول:', bootErr.message);
    }

    isPostgresConnected = true;
    console.log('✅ [Database] متصل بقاعدة بيانات PostgreSQL بنجاح في:', res.rows[0].now);
    
    client.release();
    return true;
  } catch (error: any) {
    isPostgresConnected = false;
    console.warn('ℹ️ [Database] يعمل الآن بنظام الذاكرة المتكامل المحفوظ على القرص (In-Memory Engine with File Persistence):', error.message);
    return false;
  }
}

export { isPostgresConnected };
