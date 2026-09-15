-- 1. الدول
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    info_ar TEXT,
    info_en TEXT,
    image_url VARCHAR(500)
);

-- 2. الجامعات
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    country_id INT REFERENCES countries(id) ON DELETE SET NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    details_ar TEXT,
    details_en TEXT,
    cost_info TEXT,
    ranking INT,
    website_url VARCHAR(500),
    image_url VARCHAR(500)
);

-- 3. التخصصات
CREATE TABLE IF NOT EXISTS majors (
    id SERIAL PRIMARY KEY,
    university_id INT REFERENCES universities(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL
);

-- 4. المستخدمون (المدراء والموظفون)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(100),
    role VARCHAR(50) DEFAULT 'staff', -- admin, staff, editor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. العملاء (الطلاب)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    preferences JSONB DEFAULT '{"contact": "email"}',
    current_status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. الطلبات
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    university_id INT REFERENCES universities(id) ON DELETE SET NULL,
    major_id INT REFERENCES majors(id) ON DELETE SET NULL,
    country_id INT REFERENCES countries(id) ON DELETE SET NULL,
    staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'under_review',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. المستندات
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(100),
    status VARCHAR(50), -- accepted, rejected, pending, missing
    file_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. المحادثات
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(id) ON DELETE CASCADE,
    sender_id INT,
    sender_type VARCHAR(50), -- 'user' أو 'customer'
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. بيانات الموقع
CREATE TABLE IF NOT EXISTS paragraphs (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    text_ar TEXT,
    text_en TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value_ar TEXT,
    value_en TEXT,
    value_numeric NUMERIC,
    category VARCHAR(50) -- 'company_info', 'theme', 'external_api'
);

-- 11. سجل التدقيق
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. المواعيد
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    meeting_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    meeting_link VARCHAR(500)
);

-- 13. سجل الإشعارات
CREATE TABLE IF NOT EXISTS notifications_log (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    channel VARCHAR(50), -- 'email', 'telegram', 'whatsapp'
    content TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. تاريخ حالة الطلب
CREATE TABLE IF NOT EXISTS application_status_history (
    id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
