-- ============================================================================
-- سكريبت تهيئة وتأسيس قاعدة بيانات آفاق العالمية (Afaq Global PostgreSQL Init)
-- ============================================================================
-- يتم تشغيل هذا الملف تلقائياً بواسطة حاوية Docker (afaq_postgres)
-- عند إنشاء قاعدة البيانات لأول مرة عبر /docker-entrypoint-initdb.d/
-- ============================================================================

-- تفعيل امتداد توليد المعرفات الفريدة UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. جدول إعدادات ومعطيات الموقع الديناميكية (Site Settings & Dynamic Content)
-- ----------------------------------------------------------------------------
-- يسمح هذا الجدول بتعديل أرقام الهواتف، الإيميلات، العناوين، ونصوص الواجهة
-- من صفحة الأدمن مباشرة دون الحاجة لإعادة رفع أو بناء الكود
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج القيم الافتراضية المبدئية لإعدادات المنصة
INSERT INTO site_settings (key, value, category, description) VALUES
('company_name_ar', 'آفاق العالمية للخدمات التعليمية والقبولات الجامعية', 'branding', 'الاسم التجاري بالعربية'),
('company_name_en', 'Afaq Global Education & University Placements', 'branding', 'Brand Name in English'),
('company_phone', '+966 50 876 5432', 'contact', 'رقم الهاتف الرئيسي للاتصال المباشر'),
('company_whatsapp', '+966 50 876 5432', 'contact', 'رقم الواتساب الرسمي للاستشارات السريعة'),
('company_email', 'admissions@afaq-global.amrodev.com', 'contact', 'البريد الرسمي المعتمد لاستقبال الاستفسارات'),
('support_email', 'support@afaq-global.amrodev.com', 'contact', 'بريد الدعم الفني والمتابعة'),
('company_address_ar', 'المملكة العربية السعودية، الرياض - طريق الملك فهد - برج الفيصلية، الطابق 14', 'contact', 'العنوان المقر الرئيسي بالعربية'),
('company_address_en', 'King Fahd Road, Al Faisaliah Tower, 14th Floor, Riyadh, Saudi Arabia', 'contact', 'Headquarters Address in English'),
('working_hours_ar', 'الأحد إلى الخميس: 9:00 صباحاً - 6:00 مساءً (توقيت مكة)', 'contact', 'أوقات العمل الرسمية'),
('working_hours_en', 'Sunday to Thursday: 9:00 AM - 6:00 PM (GMT+3)', 'contact', 'Official Working Hours'),
('hero_title_ar', 'بوابتك المعتمدة للقبول الجامعي في بريطانيا، أستراليا ونيوزيلندا', 'content', 'العنوان الرئيسي للصفحة الرئيسية'),
('hero_title_en', 'Your Certified Gateway to Premier UK, Australian & New Zealand Universities', 'content', 'Hero Main Headline in English'),
('hero_subtitle_ar', 'قبولك الجامعي مجاناً 100% وبدون أي أتعاب وكالة. تمثيل رسمي ومعتمد لأعرق الجامعات العالمية.', 'content', 'الوصف الفرعي لتأكيد المجانية التامة'),
('hero_subtitle_en', '100% Free Placement with Zero Agency Fees. Official and Certified Representative.', 'content', 'Hero Subtitle in English'),
('announcement_banner_ar', 'التسجيل مفتوح الآن للفصل الدراسي القادم 2026/2027 مع منح تفوق تصل حتى 30%', 'announcements', 'شريط التنبيهات الإعلاني في أعلى الموقع'),
('announcement_banner_en', 'Admissions now open for 2026/2027 intakes with scholarships up to 30%', 'announcements', 'Top Announcement Banner in English'),
('admin_notification_email', 'admin@amrodev.com, amr.nzzal@gmail.com', 'notifications', 'قائمة إيميلات الإدارة لاستلام تنبيهات الطلبات الجديدة'),
('telegram_bot_token', '', 'notifications', 'رمز توكن بوت تلغرام لإرسال الإشعارات التلقائية للمدراء'),
('telegram_chat_id', '', 'notifications', 'معرف المحادثة أو القناة الإدارية بتلغرام لاستقبال التنبيهات')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. جدول الجامعات والوجهات المعتمدة (Universities Directory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    country VARCHAR(50) NOT NULL, -- 'uk', 'australia', 'new_zealand'
    city VARCHAR(100) NOT NULL,
    city_ar VARCHAR(100) NOT NULL,
    image TEXT,
    world_rank INT,
    badge_ar VARCHAR(100),
    badge_en VARCHAR(100),
    tuition_range VARCHAR(100),
    intakes TEXT[],
    scholarship_rate VARCHAR(255),
    popular_majors TEXT[],
    description_ar TEXT,
    description_en TEXT,
    gcc_accredited BOOLEAN DEFAULT true,
    work_rights TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج الجامعات الأولية البريطانية والأسترالية والنيوزيلندية
INSERT INTO universities (
    id, name, name_ar, country, city, city_ar, image, world_rank, 
    badge_ar, badge_en, tuition_range, intakes, scholarship_rate, 
    popular_majors, description_ar, description_en, gcc_accredited, work_rights
) VALUES
(
    'uk-manchester',
    'University of Manchester',
    'جامعة مانشستر',
    'uk',
    'Manchester',
    'مانشستر',
    '/images/uk.jpg',
    32,
    'مجموعة راسل للجامعات العريقة',
    'Russell Group Member',
    '£22,000 - £31,000 / سنوياً',
    ARRAY['سبتمبر 2026', 'يناير 2027'],
    'خصم يصل إلى 30% للمتميزين',
    ARRAY['الهندسة الميكانيكية', 'إدارة الأعمال MBA', 'الذكاء الاصطناعي', 'العلوم الطبية'],
    'واحدة من أعرق جامعات بريطانيا، متصدرة في الأبحاث والابتكار وتحظى بثقة واعتماد كامل من وزارات التعليم الخليجية.',
    'A world-leading research powerhouse and Russell Group institution with strong global alumni.',
    true,
    '20 ساعة أسبوعياً أثناء الدراسة + سنتين تأشيرة عمل بعد التخرج (Graduate Route)'
),
(
    'aus-sydney',
    'University of Sydney',
    'جامعة سيدني',
    'australia',
    'Sydney',
    'سيدني',
    '/images/australia.jpg',
    18,
    'مجموعة الثمانية Go8 الأسترالية',
    'Group of Eight (Go8)',
    'AUD 38,000 - 52,000 / سنوياً',
    ARRAY['فبراير 2027', 'يوليو 2026'],
    'منح التميز الأكاديمي الدولية حتى 20%',
    ARRAY['علوم البيانات والذكاء الاصطناعي', 'الطب والجراحة', 'العمارة والتصميم', 'المالية'],
    'جامعة مصنفة ضمن أفضل 20 على مستوى العالم، تقع في قلب سيدني مع مرافق بحثية ومختبرات فائقة الحداثة.',
    'Ranked in top 20 globally with exceptional graduate employability and prime research hubs.',
    true,
    '48 ساعة كل أسبوعين أثناء الفصل + تأشيرة عمل خريجين تصل حتى 4 سنوات'
),
(
    'nz-auckland',
    'University of Auckland',
    'جامعة أوكلاند',
    'new_zealand',
    'Auckland',
    'أوكلاند',
    '/images/new_zealand.jpg',
    65,
    'الجامعة الأولى في نيوزيلندا',
    '#1 University in New Zealand',
    'NZD 32,000 - 45,000 / سنوياً',
    ARRAY['فبراير 2027', 'يوليو 2026'],
    'منح ترحيبية للطلاب الدوليين',
    ARRAY['الهندسة المدنية', 'علوم البيئة والتكنولوجيا', 'إدارة الأعمال الدولية', 'الذكاء الاصطناعي'],
    'الجامعة الرائدة في نيوزيلندا ومدينة أوكلاند العالمية، تتميز بأعلى مؤشرات الأمان وجودة الحياة والترحيب بالطلاب الخليجيين.',
    'New Zealand flagship university ranked in global top 100 with scenic campus and prime research rating.',
    true,
    '20 ساعة أسبوعياً + 3 سنوات تأشيرة عمل مفتوحة بعد التخرج'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. جدول طلبات القبول والطلاب (Student Applications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(100) PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    nationality VARCHAR(100) DEFAULT 'GCC',
    country_destination VARCHAR(50) NOT NULL,
    study_level VARCHAR(50) NOT NULL,
    preferred_major VARCHAR(255),
    preferred_university_id VARCHAR(100),
    gpa VARCHAR(50),
    high_school_type VARCHAR(100),
    sponsor_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'under_review',
    stage_index INT DEFAULT 1,
    -- ⚠️ '!' = مقفل بلا كلمة مرور (لا قيمة افتراضية قابلة للتخمين مثل 123456)
    portal_password VARCHAR(100) DEFAULT '!',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. جدول المستندات والملفات المرفوعة (Application Documents)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(100) PRIMARY KEY,
    application_id VARCHAR(100) REFERENCES applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. جدول الملاحظات الإدارية والمستشارين (Counselor Internal Notes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS internal_notes (
    id VARCHAR(100) PRIMARY KEY,
    application_id VARCHAR(100) REFERENCES applications(id) ON DELETE CASCADE,
    author VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. جدول سجل الإشعارات الصادرة (Notification Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(20) NOT NULL, -- 'email', 'telegram', 'whatsapp'
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent',
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
