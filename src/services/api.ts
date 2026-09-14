/**
 * ============================================================================
 * عميل الاتصال بواجهات الـ API (Afaq Frontend API Client)
 * ============================================================================
 * يوفر دوال قياسية ومبسطة للاتصال بخادم Express و PostgreSQL:
 * 1. جلب وتحديث إعدادات ومعطيات الموقع.
 * 2. إرسال واستعلام طلبات القبول والتسجيل.
 * 3. جلب قائمة الجامعات المعتمدة.
 */

import { Application, University } from '../types';

export interface SiteSettings {
  company_name_ar: string;
  company_name_en: string;
  company_phone: string;
  company_whatsapp: string;
  company_email: string;
  support_email: string;
  company_address_ar: string;
  company_address_en: string;
  working_hours_ar: string;
  working_hours_en: string;
  hero_title_ar: string;
  hero_title_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  announcement_banner_ar: string;
  announcement_banner_en: string;
  admin_notification_email: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
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
  hero_subtitle_en: '100% Free Placement with Zero Agency Fees. Official and Certified Representative.',
  announcement_banner_ar: 'التسجيل مفتوح الآن للفصل الدراسي القادم 2026/2027 مع منح تفوق تصل حتى 30%',
  announcement_banner_en: 'Admissions now open for 2026/2027 intakes with scholarships up to 30%',
  admin_notification_email: 'admin@amrodev.com, amr.nzzal@gmail.com',
  telegram_bot_token: '',
  telegram_chat_id: '',
};

/**
 * جلب إعدادات الموقع الديناميكية من السيرفر
 */
export async function getSiteSettings(): Promise<{ settings: SiteSettings; source: string }> {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return {
      settings: { ...DEFAULT_SETTINGS, ...json.data },
      source: json.source || 'default',
    };
  } catch (err) {
    console.warn('⚠️ [API Client] استخدم الإعدادات الافتراضية نظراً لتعذر الاتصال بـ /api/settings:', err);
    return { settings: DEFAULT_SETTINGS, source: 'offline-fallback' };
  }
}

/**
 * تحديث إعدادات الموقع (من لوحة تحكم المشرف)
 */
export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    console.error('❌ [API Client] فشل تحديث الإعدادات:', err);
    return false;
  }
}

/**
 * إرسال طلب قبول جامعي جديد إلى خادم الباك إند
 */
export async function submitApplicationAPI(formData: any): Promise<{ success: boolean; applicationNumber: string; data?: Application; error?: string }> {
  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'فشل إرسال الطلب');
    }
    return {
      success: true,
      applicationNumber: json.applicationNumber,
      data: json.data,
    };
  } catch (err: any) {
    console.error('❌ [API Client] خطأ في تقديم الطلب:', err.message);
    return {
      success: false,
      applicationNumber: `AFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      error: err.message,
    };
  }
}

/**
 * جلب جميع طلبات القبول للمشرفين
 */
export async function fetchApplicationsAPI(): Promise<Application[]> {
  try {
    const res = await fetch('/api/applications');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('⚠️ [API Client] تعذر جلب الطلبات من السيرفر:', err);
    return [];
  }
}

/**
 * تحديث حالة طلب معين
 */
export async function updateApplicationStatusAPI(id: string, status: string, stageIndex?: number, note?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, stageIndex, note }),
    });
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    console.error('❌ [API Client] خطأ في تحديث حالة الطلب:', err);
    return false;
  }
}

/**
 * تحديث وتخزين بيانات الطلب الكاملة في قاعدة بيانات PostgreSQL
 */
export async function updateApplicationFullAPI(id: string, updates: Partial<Application>): Promise<{ success: boolean; data?: Application }> {
  try {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return { success: json.success === true, data: json.data };
  } catch (err) {
    console.error('❌ [API Client] خطأ في حفظ بيانات الطلب:', err);
    return { success: false };
  }
}

/**
 * فحص صحة اتصال السيرفر وقاعدة البيانات
 */
export async function checkServerHealthAPI(): Promise<{ ok: boolean; postgres: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { ok: false, postgres: false };
    const json = await res.json();
    return { ok: true, postgres: json.postgresConnected === true };
  } catch {
    return { ok: false, postgres: false };
  }
}

/**
 * تسجيل دخول بوابة الطالب المخصصة
 */
export async function studentPortalLoginAPI(loginId: string, password: string): Promise<{ success: boolean; data?: Application; error?: string }> {
  try {
    const res = await fetch('/api/applications/portal-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'فشل تسجيل الدخول' };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر الاتصال بالخادم' };
  }
}

/**
 * تحديث كلمة مرور الطالب من قبل المشرف
 */
export async function updatePortalPasswordAPI(appId: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/applications/${appId}/portal-password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const json = await res.json();
    return { success: json.success === true, message: json.message || json.error };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * إرسال أو إعادة إرسال بيانات الدخول إلى إيميل الطالب عبر Gmail
 */
export async function sendCredentialsEmailAPI(appId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/applications/${appId}/send-credentials`, {
      method: 'POST',
    });
    const json = await res.json();
    return { success: json.success === true, message: json.message || json.error };
  } catch (err: any) {
    return { success: false, message: err.message || 'تعذر إرسال البريد' };
  }
}

