/**
 * ============================================================================
 * وحدة الاتصال بقاعدة بيانات PostgreSQL (PostgreSQL Database Pool Connection)
 * ============================================================================
 * هذا الملف مسؤول عن:
 * 1. إنشاء مجمع الاتصالات (Connection Pool) بقاعدة بيانات PostgreSQL.
 * 2. قراءة متغير البيئة DATABASE_URL أو خيارات الاتصال المنفصلة.
 * 3. توفير آلية احتياطية ذكية (Fallback In-Memory Store) في حال عدم توفر
 *    قاعدة البيانات في بيئة المعاينة الأولية حتى لا يتعطل الموقع مطلقاً.
 * 4. تنفيذ الاستعلامات مع تسجيل الأخطاء بوضوح باللغتين العربية والإنجليزية.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { UNIVERSITIES_DATA, MOCK_APPLICATIONS } from '../src/data/mockData';

dotenv.config();

const { Pool } = pg;

// قراءة رابط الاتصال بقاعدة البيانات من متغيرات البيئة
const databaseUrl = process.env.DATABASE_URL || 'postgres://afaq_user:ChangeMeSecurePassword123@localhost:5432/afaq_db';

export const pool = new Pool({
  connectionString: databaseUrl,
  // خيارات الأمان والاتصال السلس
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // أقصى عدد للاتصالات المتزامنة
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000, // مهلة فحص الاتصال
});

// حالة الاتصال بقاعدة البيانات الفعلية
let isPostgresConnected = false;

// مخزن الذاكرة الاحتياطي (في حال لم تكن قاعدة بيانات بوستجريس مشغلة بعد)
const inMemoryStore = {
  settings: {
    company_name_ar: 'آفاق العالمية للخدمات التعليمية والقبولات الجامعية',
    company_name_en: 'Afaq Global Education & University Placements',
    company_phone: '+966 50 876 5432',
    company_whatsapp: '+966 50 876 5432',
    company_email: 'admissions@afaq-global.amrodev.com',
    support_email: 'support@afaq-global.amrodev.com',
    company_address_ar: 'المملكة العربية السعودية، الرياض - طريق الملك فهد - برج الفيصلية، الطابق 14',
    company_address_en: 'King Fahd Road, Al Faisaliah Tower, 14th Floor, Riyadh, Saudi Arabia',
    working_hours_ar: 'الأحد إلى الخميس: 9:00 صباحاً - 6:00 مساءً (توقيت مكة)',
    working_hours_en: 'Sunday to Thursday: 9:00 AM - 6:00 PM (GMT+3)',
    hero_title_ar: 'بوابتك المعتمدة للقبول الجامعي في بريطانيا، أستراليا ونيوزيلندا',
    hero_title_en: 'Your Certified Gateway to Premier UK, Australian & New Zealand Universities',
    hero_subtitle_ar: 'قبولك الجامعي مجاناً 100% وبدون أي أتعاب وكالة. تمثيل رسمي ومعتمد لأعرق الجامعات العالمية.',
    hero_subtitle_en: '100% Free Placement with Zero Agency Fees. Official and Certified Representative of Leading World Universities.',
    announcement_banner_ar: 'التسجيل مفتوح الآن للفصل الدراسي القادم 2026/2027 مع منح تفوق تصل حتى 30%',
    announcement_banner_en: 'Admissions now open for 2026/2027 intakes with scholarships up to 30%',
    admin_notification_email: 'admin@amrodev.com, amr.nzzal@gmail.com',
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID || '',
  } as Record<string, string>,
  universities: [...UNIVERSITIES_DATA],
  applications: [...MOCK_APPLICATIONS],
};

/**
 * فحص الاتصال بقاعدة بيانات PostgreSQL عند إقلاع السيرفر
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    isPostgresConnected = true;
    console.log('✅ [Database] تم الاتصال بقاعدة بيانات PostgreSQL بنجاح في:', res.rows[0].now);
    return true;
  } catch (error: any) {
    isPostgresConnected = false;
    console.warn('⚠️ [Database] تعذر الاتصال بـ PostgreSQL المباشر، سيتم استخدام مخزن الذاكرة الذكي (In-Memory Store):', error.message);
    return false;
  }
}

/**
 * تنفيذ استعلام عام مع دعم الـ Fallback
 */
export async function query(text: string, params?: any[]) {
  if (isPostgresConnected) {
    try {
      return await pool.query(text, params);
    } catch (err: any) {
      console.error('❌ خطأ في استعلام SQL:', err.message);
      throw err;
    }
  }
  return null;
}

export { isPostgresConnected, inMemoryStore };
