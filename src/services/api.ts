/**
 * ============================================================================
 * عميل الاتصال بواجهات الـ API (Afaq Frontend API Client)
 * ============================================================================
 */

import { 
  Application, 
  CountryEntity, 
  UniversityEntity, 
  MajorEntity, 
  StaffUserEntity, 
  CustomerEntity, 
  MeetingEntity, 
  CMSParagraphEntity 
} from '../types';

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

// ==========================================
// 1. إعدادات المنصة وقاعدة البيانات
// ==========================================

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
    return { settings: DEFAULT_SETTINGS, source: 'offline-fallback' };
  }
}

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
    return false;
  }
}

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

// ==========================================
// 2. إدارة الدول والوجهات الدراسية (Countries)
// ==========================================

export async function fetchCountriesAPI(): Promise<CountryEntity[]> {
  try {
    const res = await fetch('/api/countries');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching countries:', err);
    return [];
  }
}

export async function createCountryAPI(data: Partial<CountryEntity>): Promise<{ success: boolean; data?: CountryEntity; error?: string }> {
  try {
    const res = await fetch('/api/countries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCountryAPI(id: number, data: Partial<CountryEntity>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/countries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCountryAPI(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/countries/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

// ==========================================
// 3. إدارة الجامعات (Universities)
// ==========================================

export async function fetchUniversitiesAPI(countryId?: number): Promise<UniversityEntity[]> {
  try {
    const url = countryId ? `/api/universities?country_id=${countryId}` : '/api/universities';
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching universities:', err);
    return [];
  }
}

export async function createUniversityAPI(data: Partial<UniversityEntity>): Promise<{ success: boolean; data?: UniversityEntity; error?: string }> {
  try {
    const res = await fetch('/api/universities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateUniversityAPI(id: number, data: Partial<UniversityEntity>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/universities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUniversityAPI(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/universities/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

// ==========================================
// 4. إدارة التخصصات (Majors)
// ==========================================

export async function fetchMajorsAPI(universityId?: number): Promise<MajorEntity[]> {
  try {
    const url = universityId ? `/api/majors?university_id=${universityId}` : '/api/majors';
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching majors:', err);
    return [];
  }
}

export async function createMajorAPI(data: Partial<MajorEntity>): Promise<{ success: boolean; data?: MajorEntity; error?: string }> {
  try {
    const res = await fetch('/api/majors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateMajorAPI(id: number, data: Partial<MajorEntity>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/majors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMajorAPI(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/majors/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

// ==========================================
// 5. إدارة الموظفين والمستشارين (Staff / Users)
// ==========================================

export async function loginStaffAPI(username: string, password: string): Promise<{ success: boolean; user?: StaffUserEntity; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'فشل تسجيل الدخول' };
    }
    return { success: true, user: json.user, message: json.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ في الاتصال بالخادم' };
  }
}

export async function fetchStaffUsersAPI(): Promise<StaffUserEntity[]> {
  try {
    const res = await fetch('/api/users');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function createStaffUserAPI(data: any): Promise<{ success: boolean; data?: StaffUserEntity; error?: string }> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateStaffUserAPI(id: number, data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteStaffUserAPI(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

// ==========================================
// 6. إدارة الطلاب (Customers)
// ==========================================

export async function fetchCustomersAPI(): Promise<CustomerEntity[]> {
  try {
    const res = await fetch('/api/customers');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

// ==========================================
// 7. إدارة المواعيد والاستشارات (Meetings)
// ==========================================

export async function fetchMeetingsAPI(): Promise<MeetingEntity[]> {
  try {
    const res = await fetch('/api/meetings');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function bookMeetingAPI(data: Partial<MeetingEntity>): Promise<{ success: boolean; message?: string; data?: MeetingEntity; error?: string }> {
  try {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateMeetingAPI(id: number, data: Partial<MeetingEntity>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// 8. إدارة محتوى ونصوص الموقع (CMS Paragraphs)
// ==========================================

export async function fetchCMSParagraphsAPI(): Promise<CMSParagraphEntity[]> {
  try {
    const res = await fetch('/api/paragraphs');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function updateCMSParagraphAPI(slug: string, data: Partial<CMSParagraphEntity>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/paragraphs/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// 9. طلبات القبول والطلاب (Applications)
// ==========================================

export async function fetchApplicationsAPI(): Promise<Application[]> {
  try {
    const res = await fetch('/api/applications');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('تعذر جلب الطلبات من السيرفر:', err);
    return [];
  }
}

export async function submitApplicationAPI(formData: any): Promise<{ success: boolean; applicationNumber: string; data?: Application; error?: string }> {
  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'فشل إرسال الطلب');
    return {
      success: true,
      applicationNumber: json.applicationNumber,
      data: json.data,
    };
  } catch (err: any) {
    return {
      success: false,
      applicationNumber: `AFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      error: err.message,
    };
  }
}

export async function updateApplicationFullAPI(appId: string, updates: Partial<Application>): Promise<boolean> {
  try {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function updateApplicationStatusAPI(id: string, status: string, stageOrder?: number, note?: string, staffId?: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, stageOrder, staffId }),
    });
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    return false;
  }
}

export async function updateDocumentStatusAPI(appId: string, docId: number | string, status: string, feedback?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/applications/${appId}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feedback }),
    });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function uploadStudentDocumentAPI(
  appId: string,
  docData: {
    docId?: string | number;
    docType: string;
    nameAr: string;
    nameEn: string;
    fileName: string;
    fileSize?: string;
    fileUrl?: string;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/applications/${appId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || 'فشل رفع المستند' };
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر رفع المستند إلى الخادم' };
  }
}

export async function deleteStudentDocumentAPI(appId: string, docId: string | number): Promise<boolean> {
  try {
    const res = await fetch(`/api/applications/${appId}/documents/${docId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function studentPortalLoginAPI(loginId: string, password: string): Promise<{ success: boolean; data?: Application; error?: string }> {
  try {
    const res = await fetch('/api/applications/portal-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || 'فشل تسجيل الدخول' };
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر الاتصال بالخادم' };
  }
}

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
