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
  // ملاحظة أمنية: أُزيلت حقول telegram_bot_token / telegram_chat_id من واجهة العميل.
  // الخادم لم يعد يُرسلها (تُقنَّع إن وُجدت)، والأسرار تبقى في متغيّرات البيئة.
  theme_primary_color?: string;
  theme_contrast_mode?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
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
  hero_subtitle_en: '100% Free Placement with Zero Agency Fees. Official and Certified Representative.',
  announcement_banner_ar: 'التسجيل مفتوح الآن للفصل الدراسي 2026/2027 مع منح تفوق تصل حتى 40% من الرسوم الدراسية',
  announcement_banner_en: 'Admissions now open for 2026/2027 intakes with merit scholarships up to 40% tuition reduction',
  admin_notification_email: 'admin@amrodev.com',
  theme_primary_color: 'amber',
  theme_contrast_mode: 'normal',
};

// ==========================================
// 0. طبقة الاتصال الموحّدة (Shared Fetch Layer)
// ==========================================

/**
 * كل نداءات الـ API تمرّ من هنا لإرسال كوكي الجلسة (httpOnly) مع كل طلب.
 *
 * ملاحظة أمنية مهمّة: لم يعد هناك أي رمز جلسة مخزَّن في localStorage أو
 * sessionStorage. الجلسة كوكي httpOnly لا تستطيع الجافاسكربت قراءتها،
 * فسرقتها عبر XSS غير ممكنة (بخلاف التخزين في المتصفح).
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, { credentials: 'same-origin', ...init });
}

/** نتيجة موحّدة لفحص الجلسة */
export interface SessionCheck<T> {
  authenticated: boolean;
  data?: T;
  error?: string;
}

/** فحص جلسة الموظف من الخادم (المصدر الوحيد للحقيقة — لا sessionStorage) */
export async function fetchCurrentStaffAPI(): Promise<SessionCheck<StaffUserEntity>> {
  try {
    const res = await apiFetch('/api/users/me');
    if (!res.ok) return { authenticated: false };
    const json = await res.json();
    return { authenticated: true, data: json.user };
  } catch {
    return { authenticated: false, error: 'تعذّر الاتصال بالخادم' };
  }
}

/** إنهاء جلسة الموظف على الخادم (يُبطل الرمز فعلياً، لا يخفي الواجهة فقط) */
export async function logoutStaffAPI(): Promise<void> {
  try {
    await apiFetch('/api/users/logout', { method: 'POST' });
  } catch {
    /* تجاهل — الجلسة تنتهي على أي حال بانتهاء صلاحيتها */
  }
}

/** فحص جلسة الطالب من الخادم */
export async function fetchPortalSessionAPI(): Promise<SessionCheck<Application>> {
  try {
    const res = await apiFetch('/api/applications/portal-session');
    if (!res.ok) return { authenticated: false };
    const json = await res.json();
    if (json.kind === 'staff') return { authenticated: false };
    return { authenticated: true, data: json.data };
  } catch {
    return { authenticated: false, error: 'تعذّر الاتصال بالخادم' };
  }
}

/** إنهاء جلسة الطالب على الخادم */
export async function logoutPortalAPI(): Promise<void> {
  try {
    await apiFetch('/api/applications/portal-logout', { method: 'POST' });
  } catch {
    /* تجاهل */
  }
}

// ==========================================
// 1. إعدادات المنصة وقاعدة البيانات
// ==========================================

export async function getSiteSettings(): Promise<{ settings: SiteSettings; source: string }> {
  try {
    const res = await apiFetch('/api/settings');
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
    const res = await apiFetch('/api/settings', {
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
    const res = await apiFetch('/api/health');
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
    const res = await apiFetch('/api/countries');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching countries:', err);
    return [];
  }
}

export async function createCountryAPI(data: Partial<CountryEntity>): Promise<{ success: boolean; data?: CountryEntity; error?: string }> {
  try {
    const res = await apiFetch('/api/countries', {
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
    const res = await apiFetch(`/api/countries/${id}`, {
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
    const res = await apiFetch(`/api/countries/${id}`, { method: 'DELETE' });
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
    const res = await apiFetch(url);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching universities:', err);
    return [];
  }
}

export async function createUniversityAPI(data: Partial<UniversityEntity>): Promise<{ success: boolean; data?: UniversityEntity; error?: string }> {
  try {
    const res = await apiFetch('/api/universities', {
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
    const res = await apiFetch(`/api/universities/${id}`, {
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
    const res = await apiFetch(`/api/universities/${id}`, { method: 'DELETE' });
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
    const res = await apiFetch(url);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching majors:', err);
    return [];
  }
}

export async function createMajorAPI(data: Partial<MajorEntity>): Promise<{ success: boolean; data?: MajorEntity; error?: string }> {
  try {
    const res = await apiFetch('/api/majors', {
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
    const res = await apiFetch(`/api/majors/${id}`, {
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
    const res = await apiFetch(`/api/majors/${id}`, { method: 'DELETE' });
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
    const res = await apiFetch('/api/users/login', {
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
    const res = await apiFetch('/api/users');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function createStaffUserAPI(data: any): Promise<{ success: boolean; data?: StaffUserEntity; error?: string }> {
  try {
    const res = await apiFetch('/api/users', {
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
    const res = await apiFetch(`/api/users/${id}`, {
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
    const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
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
    const res = await apiFetch('/api/customers');
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
    const res = await apiFetch('/api/meetings');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function bookMeetingAPI(data: Partial<MeetingEntity>): Promise<{ success: boolean; message?: string; data?: MeetingEntity; error?: string }> {
  try {
    const res = await apiFetch('/api/meetings', {
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
    const res = await apiFetch(`/api/meetings/${id}`, {
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
    const res = await apiFetch('/api/paragraphs');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

export async function updateCMSParagraphAPI(slug: string, data: Partial<CMSParagraphEntity>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/paragraphs/${slug}`, {
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
    const res = await apiFetch('/api/applications');
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
    const res = await apiFetch('/api/applications', {
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
    const res = await apiFetch(`/api/applications/${appId}`, {
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
    const res = await apiFetch(`/api/applications/${id}/status`, {
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
    const res = await apiFetch(`/api/applications/${appId}/documents/${docId}`, {
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
    const res = await apiFetch(`/api/applications/${appId}/documents`, {
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
    const res = await apiFetch(`/api/applications/${appId}/documents/${docId}`, {
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
    const res = await apiFetch('/api/applications/portal-login', {
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
    const res = await apiFetch(`/api/applications/${appId}/portal-password`, {
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
    const res = await apiFetch(`/api/applications/${appId}/send-credentials`, {
      method: 'POST',
    });
    const json = await res.json();
    return { success: json.success === true, message: json.message || json.error };
  } catch (err: any) {
    return { success: false, message: err.message || 'تعذر إرسال البريد' };
  }
}

export async function sendCustomStudentResponseAPI(
  appId: string, 
  channel: 'email' | 'whatsapp' | 'telegram', 
  messageText: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch(`/api/applications/${appId}/send-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, messageText }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || 'فشل إرسال الرسالة' };
    return { success: true, message: json.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر الاتصال بالخادم' };
  }
}

// ==========================================
// 10. إدارة المراسلات والمحادثات (Messages API)
// ==========================================

export async function fetchMessagesAPI(applicationId: string | number): Promise<any[]> {
  try {
    const res = await apiFetch(`/api/messages?application_id=${encodeURIComponent(applicationId)}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('تعذر جلب الرسائل من السيرفر:', err);
    return [];
  }
}

export async function sendMessageAPI(msgData: {
  application_id: string | number;
  sender_id?: number | null;
  sender_type?: 'student' | 'user' | 'counselor';
  sender_name?: string;
  message_text: string;
  is_internal_note?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await apiFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgData),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || 'فشل إرسال الرسالة' };
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر الاتصال بالخادم' };
  }
}

