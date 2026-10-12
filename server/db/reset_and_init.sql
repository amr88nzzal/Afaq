-- ============================================================================
-- سكربت إعادة بناء وتهيئة قاعدة بيانات منصة آفاق العالمية بالكامل من الصفر
-- Clean Reset, Schema Creation & Data Seeding Script for PostgreSQL
-- ============================================================================

-- 1. إزالة كافة الجداول القديمة المتعارضة مع كافة القيود والمفاتيح الأجنبية
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS paragraphs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS majors CASCADE;
DROP TABLE IF EXISTS universities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- ============================================================================
-- 2. إنشاء الجداول الأساسية المعتمدة (11 جدولاً)
-- ============================================================================

-- 1. جدول الدول والوجهات الدراسية
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    info_ar TEXT,
    info_en TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول الجامعات المعتمدة
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    country_id INT REFERENCES countries(id) ON DELETE SET NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    city_ar VARCHAR(100),
    city_en VARCHAR(100),
    details_ar TEXT,
    details_en TEXT,
    cost_info VARCHAR(255),
    ranking INT,
    acceptance_rate VARCHAR(50),
    featured BOOLEAN DEFAULT FALSE,
    website_url VARCHAR(500),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول التخصصات والبرامج الأكاديمية
CREATE TABLE majors (
    id SERIAL PRIMARY KEY,
    university_id INT REFERENCES universities(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- medicine, engineering, business, computing, arts, law
    degree_level VARCHAR(50) DEFAULT 'bachelor', -- foundation, bachelor, master, phd
    duration VARCHAR(50),
    annual_tuition VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول المستخدمين (المدراء والمستشارين الأكاديميين)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(100),
    role VARCHAR(50) DEFAULT 'staff', -- admin, counselor, editor, staff
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول العملاء والطلاب المسجلين
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    nationality VARCHAR(100) DEFAULT 'Saudi',
    preferences JSONB DEFAULT '{"contact_method": "whatsapp", "newsletter": true}',
    current_status VARCHAR(100) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. جدول طلبات القبول الجامعي
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    university_id INT REFERENCES universities(id) ON DELETE SET NULL,
    major_id INT REFERENCES majors(id) ON DELETE SET NULL,
    country_id INT REFERENCES countries(id) ON DELETE SET NULL,
    staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    study_level VARCHAR(50) DEFAULT 'bachelor',
    intake_season VARCHAR(50) DEFAULT 'September 2026',
    sponsor_type VARCHAR(50) DEFAULT 'self', -- self, government, scholarship
    gpa VARCHAR(50),
    high_school_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'under_review',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول المستندات والوثائق المرفوعة
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(100) NOT NULL, -- passport, transcript, english_test, sop, recommendation, cv
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, missing
    file_url VARCHAR(500),
    feedback TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول الرسائل والمحادثات والملاحظات الداخلية
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(id) ON DELETE CASCADE,
    sender_id INT,
    sender_type VARCHAR(50) NOT NULL, -- 'user', 'customer', 'system'
    sender_name VARCHAR(255),
    message_text TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. جدول نصوص ومحتوى الموقع (CMS Paragraphs)
CREATE TABLE paragraphs (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    text_ar TEXT NOT NULL,
    text_en TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. جدول الإعدادات وبيانات التواصل والإشعارات
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value_ar TEXT,
    value_en TEXT,
    value_numeric NUMERIC,
    category VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. جدول المواعيد والاستشارات الأكاديمية
CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time VARCHAR(20) NOT NULL,
    meeting_type VARCHAR(50) DEFAULT 'video',
    status VARCHAR(50) DEFAULT 'scheduled',
    meeting_link VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. جدول سجل الأنشطة والتدقيق (Audit Logs)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. إدراج البيانات الأولية (Seed Data)
-- ============================================================================

-- الدول
INSERT INTO countries (id, code, name_ar, name_en, info_ar, info_en, image_url, is_active) VALUES
(1, 'uk', 'المملكة المتحدة (بريطانيا)', 'United Kingdom', 'أعرق النظم الأكاديمية عالمياً، دراسة البكالوريوس في 3 سنوات والماجستير في سنة مكثفة مع تأشيرة عمل لمدة سنتين بعد التخرج.', '3-year Bachelor and 1-year Master with 2-year Graduate Route work visa.', '/images/uk.jpg', true),
(2, 'australia', 'أستراليا', 'Australia', 'أعلى جودة حياة وتصنيف جامعي، مع تصريح عمل أثناء الدراسة وتأشيرة عمل بعد التخرج تصل إلى 4 سنوات.', 'Top ranked universities with work rights and post-study visas.', '/images/australia.jpg', true),
(3, 'new_zealand', 'نيوزيلندا', 'New Zealand', 'جميع جامعات نيوزيلندا مصنفة عالمياً مع بيئة آمنة وترحيب استثنائي بالطلاب الدوليين.', 'All NZ universities ranked in the top 3% worldwide with outstanding safety.', '/images/new_zealand.jpg', true);
SELECT setval('countries_id_seq', (SELECT MAX(id) FROM countries));

-- الجامعات
INSERT INTO universities (id, country_id, name_ar, name_en, city_ar, city_en, ranking, acceptance_rate, cost_info, featured, website_url, image_url, details_ar, details_en) VALUES
(1, 1, 'جامعة مانشستر', 'University of Manchester', 'مانشستر', 'Manchester', 28, '56%', '£19,500 - £34,000 سنوياً', true, 'https://www.manchester.ac.uk', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80', 'إحدى أعرق جامعات بريطانيا وعضو مجموعة راسل المرموقة، وتخرج منها 25 حائزاً على جائزة نوبل.', 'Prestigious Russell Group institution with 25 Nobel laureates among past staff and students.'),
(2, 1, 'جامعة إدنبرة', 'University of Edinburgh', 'إدنبرة', 'Edinburgh', 22, '40%', '£22,000 - £36,500 سنوياً', true, 'https://www.ed.ac.uk', 'https://images.unsplash.com/photo-1527891751199-7225231a68dd?auto=format&fit=crop&w=800&q=80', 'جامعة تاريخية تأسست عام 1583 وتعد مركزاً عالمياً رائداً في الطب والهندسة والذكاء الاصطناعي.', 'Founded in 1583, a world-leading hub in medicine, engineering, and artificial intelligence.'),
(3, 1, 'جامعة بريستول', 'University of Bristol', 'بريستول', 'Bristol', 55, '67%', '£20,100 - £32,000 سنوياً', false, 'https://www.bristol.ac.uk', 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80', 'جامعة بحثية رائدة ومفضلة لدى كبرى الشركات العالمية لتوظيف الخريجين.', 'World top-60 research powerhouse with exceptional graduate employment rates.'),
(4, 2, 'جامعة ملبورن', 'University of Melbourne', 'ملبورن', 'Melbourne', 14, '70%', 'A$35,000 - A$48,000 سنوياً', true, 'https://www.unimelb.edu.au', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80', 'الجامعة الأولى في أستراليا وإحدى أفضل 15 جامعة عالمياً، وتتميز بأبحاثها الطبية والهندسية المتقدمة.', 'Ranked #1 in Australia with world-leading medical, business, and engineering faculties.'),
(5, 2, 'جامعة سيدني', 'University of Sydney', 'سيدني', 'Sydney', 19, '30%', 'A$38,000 - A$52,000 سنوياً', true, 'https://www.sydney.edu.au', 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80', 'أقدم جامعة في أستراليا وإحدى أكثر جامعات العالم جمالاً وتأثيراً أكاديمياً.', 'Australia’s first university, consistently ranked in the global top 20.'),
(6, 3, 'جامعة أوكلاند', 'University of Auckland', 'أوكلاند', 'Auckland', 68, '72%', 'NZ$32,000 - NZ$45,000 سنوياً', true, 'https://www.auckland.ac.nz', 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80', 'الجامعة الأكبر والأعلى تصنيفاً في نيوزيلندا ومصنفة ضمن أفضل 100 جامعة عالمياً.', 'New Zealand’s highest-ranked university, offering world-class research and innovation.');
SELECT setval('universities_id_seq', (SELECT MAX(id) FROM universities));

-- التخصصات
INSERT INTO majors (id, university_id, name_ar, name_en, category, degree_level, duration, annual_tuition) VALUES
(1, 1, 'علوم الحاسب والذكاء الاصطناعي', 'Computer Science & AI', 'computing', 'bachelor', '3 سنوات', '£26,500'),
(2, 1, 'إدارة الأعمال الدولية والمالية', 'International Business & Finance', 'business', 'bachelor', '3 سنوات', '£24,000'),
(3, 1, 'الهندسة الميكانيكية وهندسة الطيران', 'Mechanical & Aerospace Engineering', 'engineering', 'bachelor', '3 سنوات', '£27,000'),
(4, 2, 'الطب والجراحة العامة (MBChB)', 'Medicine & Surgery (MBChB)', 'medicine', 'bachelor', '5 سنوات', '£35,000'),
(5, 2, 'علم البيانات المتقدم والذكاء التوليدي', 'Data Science & Generative AI', 'computing', 'master', 'سنة واحدة', '£29,000'),
(6, 4, 'هندسة البرمجيات والنظم السحابية', 'Software & Cloud Engineering', 'computing', 'bachelor', '3 سنوات', 'A$44,000'),
(7, 4, 'الماجستير في إدارة الأعمال الدولية (MBA)', 'International MBA', 'business', 'master', 'سنتان', 'A$49,000'),
(8, 5, 'الصيدلة الإكلينيكية وعلوم الأدوية', 'Pharmacy & Pharmaceutical Sciences', 'medicine', 'bachelor', '4 سنوات', 'A$46,000'),
(9, 6, 'هندسة الطاقة المتجددة والاستدامة', 'Renewable Energy Engineering', 'engineering', 'bachelor', '4 سنوات', 'NZ$39,000');
SELECT setval('majors_id_seq', (SELECT MAX(id) FROM majors));

-- المستخدمين والمستشارين
-- ⚠️ لا تُزرع كلمات مرور نصاً صريحاً. القيمة '!' = حساب مقفل بلا كلمة مرور.
--    اضبط INITIAL_ADMIN_PASSWORD في .env لتُهيّأ كلمة مرور المدير الأول (scrypt).
INSERT INTO users (id, name, email, phone, password_hash, telegram_id, role, is_active) VALUES
(1, 'د. فيصل الشمري', 'faisal@afaq-global.com', '+966 50 123 4567', '!', '@faisal_afaq', 'admin', true),
(2, 'أ. سارة المنصور', 'sara@afaq-global.com', '+966 55 987 6543', '!', '@sara_counselor', 'counselor', true),
(3, 'م. طارق الخالدي', 'tariq@afaq-global.com', '+966 54 321 0987', '!', '@tariq_admissions', 'staff', true);
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- العملاء والطلاب
INSERT INTO customers (id, name, email, phone, whatsapp, password_hash, nationality, current_status) VALUES
(1, 'عبدالرحمن محمد العتيبي', 'abdulrahman.o@example.com', '+966 50 111 2233', '+966 50 111 2233', '!', 'سعودي', 'active'),
(2, 'نورة عبدالله السديري', 'noura.s@example.com', '+966 55 444 5566', '+966 55 444 5566', '!', 'سعودية', 'active'),
(3, 'خالد فهد الدوسري', 'khaled.d@example.com', '+966 56 777 8899', '+966 56 777 8899', '!', 'كويتي', 'active');
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- الطلبات
INSERT INTO applications (id, application_number, customer_id, university_id, major_id, country_id, staff_id, study_level, intake_season, sponsor_type, gpa, status, notes) VALUES
(1, 'AFQ-2026-8812', 1, 1, 1, 1, 1, 'bachelor', 'سبتمبر 2026', 'government', '3.92 / 4.00', 'under_review', 'طالب متميز متقدم لبرنامج خادم الحرمين الشريفين للابتعاث الخارجي. تم تدقيق جواز السفر وكشف الدرجات.'),
(2, 'AFQ-2026-4421', 2, 2, 4, 1, 2, 'bachelor', 'سبتمبر 2026', 'self', '98.5%', 'conditional_offer', 'تم الحصول على قبول مشروط بدرجة الآيلتس (المطلوب 6.5). تم حجز موعد اختبار اللغة.'),
(3, 'AFQ-2026-9055', 3, 4, 6, 2, 3, 'master', 'فبراير 2027', 'scholarship', '3.75 / 4.00', 'unconditional_offer', 'تم إصدار القبول غير المشروط وجاري إصدار الـ CAS / CoE للتقديم على تأشيرة السفر.');
SELECT setval('applications_id_seq', (SELECT MAX(id) FROM applications));

-- المستندات
INSERT INTO documents (application_id, doc_type, name_ar, name_en, status, file_url) VALUES
(1, 'passport', 'جواز السفر ساري المفعول', 'Valid Passport', 'verified', '/uploads/passports/app1_passport.pdf'),
(1, 'transcript', 'كشف درجات الثانوية المعتمد', 'Academic Transcript', 'verified', '/uploads/transcripts/app1_transcript.pdf'),
(1, 'english_test', 'شهادة اختبار اللغة (IELTS 7.0)', 'English Proficiency Test', 'verified', '/uploads/english/app1_ielts.pdf'),
(1, 'sop', 'خطاب الغرض من الدراسة (SOP)', 'Statement of Purpose', 'pending', '/uploads/sop/app1_sop.pdf'),
(2, 'passport', 'جواز السفر ساري المفعول', 'Valid Passport', 'verified', '/uploads/passports/app2_passport.pdf'),
(2, 'transcript', 'كشف درجات الثانوية', 'Academic Transcript', 'verified', '/uploads/transcripts/app2_transcript.pdf'),
(2, 'english_test', 'شهادة الآيلتس', 'English Language Test', 'missing', NULL),
(3, 'passport', 'جواز السفر ساري المفعول', 'Valid Passport', 'verified', '/uploads/passports/app3_passport.pdf'),
(3, 'transcript', 'وثيقة البكالوريوس والسجل الأكاديمي', 'Bachelor Degree & Transcripts', 'verified', '/uploads/transcripts/app3_degree.pdf');

-- المحادثات والرسائل
INSERT INTO messages (application_id, sender_id, sender_type, sender_name, message_text, is_internal_note) VALUES
(1, 1, 'user', 'د. فيصل الشمري', 'مرحباً عبدالرحمن، تم استلام أوراقك وإرسالها للملحقية الأكاديمية لمراجعة معادلة الشهادة.', false),
(1, NULL, 'customer', 'عبدالرحمن العتيبي', 'شكراً جزيلاً دكتور، بانتظار تحديثكم الكريم.', false),
(2, 2, 'user', 'أ. سارة المنصور', 'ملاحظة داخلية: تم التنسيق مع جامعة إدنبرة لتمديد مهلة تسليم الآيلتس حتى 15 يونيو.', true);

-- نصوص ومحتوى الموقع (CMS Paragraphs)
INSERT INTO paragraphs (slug, section_name, title_ar, title_en, text_ar, text_en) VALUES
('hero_main', 'الرئيسية', 'العنوان الرئيسي', 'Hero Title', 'بوابتك المعتمدة للقبول الجامعي في بريطانيا، أستراليا ونيوزيلندا', 'Your Certified Gateway to Premier UK, Australian & New Zealand Universities'),
('hero_sub', 'الرئيسية', 'الوصف الترويجي', 'Hero Subtitle', 'قبولك الجامعي مجاناً 100% وبدون أي أتعاب وكالة. تمثيل رسمي ومعتمد لأعرق الجامعات العالمية لضمان مستقبلك الأكاديمي.', '100% Free Placement with Zero Agency Fees. Official and Certified Representative of Leading Global Universities.'),
('why_us', 'عن آفاق', 'لماذا آفاق العالمية؟', 'Why Choose Afaq?', 'نمتلك شراكات رسمية مباشرة مع كبرى الجامعات ونضمن للطالب التوجيه الأكاديمي السليم واستخراج القبولات خلال وقت قياسي مع متابعة التأشيرة والسكن مجاناً.', 'We hold direct official agency agreements with prestigious universities, securing your conditional and unconditional offers in record time with free visa & accommodation support.'),
('announcement', 'التنبيهات', 'شريط التنبيهات العلوي', 'Top Announcement Bar', 'التسجيل مفتوح الآن للفصل الدراسي 2026/2027 مع منح تفوق تصل حتى 30% من الرسوم الدراسية', 'Admissions now open for 2026/2027 intakes with merit scholarships up to 30% tuition reduction')
ON CONFLICT (slug) DO UPDATE SET 
  text_ar = EXCLUDED.text_ar,
  text_en = EXCLUDED.text_en,
  updated_at = NOW();

-- الإعدادات
INSERT INTO settings (key, value_ar, value_en, value_numeric, category) VALUES
('company_name', 'آفاق العالمية للخدمات التعليمية والقبولات الجامعية', 'Afaq Global Education & University Placements', NULL, 'company_info'),
('company_phone', '+966 50 876 5432', '+966 50 876 5432', NULL, 'contact'),
('company_whatsapp', '+966 50 876 5432', '+966 50 876 5432', NULL, 'contact'),
('company_email', 'admissions@afaq-global.amrodev.com', 'admissions@afaq-global.amrodev.com', NULL, 'contact'),
('support_email', 'support@afaq-global.amrodev.com', 'support@afaq-global.amrodev.com', NULL, 'contact'),
('company_address', 'المملكة العربية السعودية، الرياض - طريق الملك فهد - برج الفيصلية، الطابق 14', 'King Fahd Road, Al Faisaliah Tower, 14th Floor, Riyadh, Saudi Arabia', NULL, 'company_info'),
('working_hours', 'الأحد إلى الخميس: 9:00 صباحاً - 6:00 مساءً (توقيت مكة)', 'Sunday to Thursday: 9:00 AM - 6:00 PM (GMT+3)', NULL, 'contact'),
('admin_notification_email', 'admin@amrodev.com, amr.nzzal@gmail.com', 'admin@amrodev.com, amr.nzzal@gmail.com', NULL, 'notifications'),
('telegram_bot_token', '', '', NULL, 'notifications'),
('telegram_chat_id', '', '', NULL, 'notifications'),
('consultation_fee', 'مجانية بالكامل', '100% Free', 0, 'general')
ON CONFLICT (key) DO NOTHING;

-- المواعيد والاستشارات
INSERT INTO meetings (id, customer_id, staff_id, customer_name, customer_email, customer_phone, destination_country, meeting_date, meeting_time, meeting_type, status, meeting_link, notes) VALUES
(1, 1, 1, 'عبدالرحمن محمد العتيبي', 'abdulrahman.o@example.com', '+966 50 111 2233', 'المملكة المتحدة', '2026-09-20', '14:00', 'video', 'scheduled', 'https://meet.google.com/afq-counsel-uk', 'استشارة حول شروط القبول ومتطلبات منحة الابتعاث لجامعة مانشستر.'),
(2, 2, 2, 'نورة عبدالله السديري', 'noura.s@example.com', '+966 55 444 5566', 'المملكة المتحدة', '2026-09-22', '16:30', 'video', 'scheduled', 'https://meet.google.com/afq-counsel-edin', 'مناقشة تحضيرات اختبار الآيلتس والمقابلة الشخصية للطب في إدنبرة.');
SELECT setval('meetings_id_seq', (SELECT MAX(id) FROM meetings));
