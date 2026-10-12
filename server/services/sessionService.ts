/**
 * ============================================================================
 * خدمة الجلسات (Session Service)
 * ============================================================================
 * تُصدر رموز جلسة عشوائية غير قابلة للتخمين (Opaque Session Tokens) بدل
 * الاعتماد على JWT. الأسباب:
 *   1. لا تحتاج أي حزمة خارجية ولا إدارة مفاتيح توقيع.
 *   2. قابلة للإبطال فوراً (logout / تعطيل حساب) — وهذا مستحيل مع JWT ساكن.
 *   3. لا تعاني من مشاكل "algorithm confusion" الشائعة في تطبيقات JWT.
 *
 * الرمز يُخزَّن كـ hash (SHA-256) في الذاكرة، فلا تُحفظ القيمة الأصلية أبداً
 * حتى لو تسرّبت ذاكرة الخادم.
 *
 * ملاحظة تصميمية: الجلسات محفوظة في ذاكرة العملية، لذا إعادة تشغيل الخادم
 * تُبطل كل الجلسات (وهذا مقبول أمنياً ومقصود). للترقية إلى تخزين دائم أو
 * موزّع لاحقاً، يكفي استبدال الـ Map أدناه بجدول sessions في PostgreSQL
 * أو بـ Redis دون تغيير أي مسار آخر.
 */

import crypto from 'crypto';

export type SessionKind = 'staff' | 'student';

export interface SessionRecord {
  tokenHash: string;
  kind: SessionKind;
  /** معرّف المستخدم للموظفين */
  userId?: number;
  /** معرّف الطلب للطلاب */
  applicationId?: number;
  role?: string;
  name?: string;
  email?: string;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
}

/** مدة صلاحية جلسة الموظف: 8 ساعات */
export const STAFF_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
/** مدة صلاحية جلسة الطالب: ساعتان */
export const STUDENT_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const sessions = new Map<string, SessionRecord>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cleanupExpired(now = Date.now()): void {
  for (const [key, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(key);
    }
  }
}

/** إنشاء جلسة جديدة وإرجاع الرمز الخام (يُسلَّم للعميل مرة واحدة فقط) */
export function createSession(
  input: Omit<SessionRecord, 'tokenHash' | 'createdAt' | 'expiresAt' | 'lastSeenAt'>,
  ttlMs: number
): { token: string; expiresAt: number } {
  cleanupExpired();
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const expiresAt = now + ttlMs;
  sessions.set(hashToken(token), {
    ...input,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt,
    lastSeenAt: now,
  });
  return { token, expiresAt };
}

/** التحقق من رمز جلسة وإرجاع بياناتها، أو null إن كانت غير صالحة/منتهية */
export function getSession(token: string | null | undefined): SessionRecord | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  const key = hashToken(token);
  const session = sessions.get(key);
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt <= now) {
    sessions.delete(key);
    return null;
  }
  session.lastSeenAt = now;
  return session;
}

/** إبطال جلسة واحدة (تسجيل خروج) */
export function destroySession(token: string | null | undefined): boolean {
  if (typeof token !== 'string' || token.length === 0) return false;
  return sessions.delete(hashToken(token));
}

/** إبطال كل جلسات مستخدم — تُستخدم عند تغيير كلمة المرور أو تعطيل الحساب */
export function destroySessionsForUser(userId: number): number {
  let removed = 0;
  for (const [key, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(key);
      removed += 1;
    }
  }
  return removed;
}

/** إبطال كل جلسات طلب معيّن */
export function destroySessionsForApplication(applicationId: number): number {
  let removed = 0;
  for (const [key, session] of sessions) {
    if (session.applicationId === applicationId) {
      sessions.delete(key);
      removed += 1;
    }
  }
  return removed;
}

/** إحصاءات تشخيصية (بلا أي بيانات حساسة) */
export function getSessionStats(): { active: number } {
  cleanupExpired();
  return { active: sessions.size };
}

/** تنظيف دوري للجلسات المنتهية */
const cleanupTimer = setInterval(() => cleanupExpired(), 15 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}
