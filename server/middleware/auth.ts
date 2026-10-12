/**
 * ============================================================================
 * وسطاء المصادقة والصلاحيات (Authentication & Authorization Middleware)
 * ============================================================================
 * يوفّر هذا الملف الضوابط التي كانت غائبة تماماً عن المشروع:
 *   - requireAuth        : يجب وجود جلسة صالحة
 *   - requireStaff       : جلسة موظف (ويمكن تحديد الأدوار المسموحة)
 *   - requireAdmin       : مدير فقط
 *   - optionalAuth       : مسارات عامة لكن تستفيد من الجلسة إن وُجدت
 *
 * الرمز يُقرأ من أحد مكانين:
 *   1. ترويسة Authorization: Bearer <token>   (للعملاء البرمجيين والاختبارات)
 *   2. الكوكي afaq_session                     (للمتصفح — httpOnly فلا تصلها الجافاسكربت)
 */

import { Request, Response, NextFunction } from 'express';
import { getSession, SessionRecord } from '../services/sessionService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** الجلسة الحالية إن وُجدت — تُملأ بواسطة وسطاء هذا الملف فقط */
      auth?: SessionRecord;
      /** الرمز الخام للجلسة — يلزم لتسجيل الخروج */
      authToken?: string;
    }
  }
}

export const SESSION_COOKIE_NAME = 'afaq_session';

/** قراءة الكوكيز بدون حزمة cookie-parser */
function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      const value = part.slice(idx + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

/** استخراج رمز الجلسة من الترويسة أو الكوكي */
export function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim();
    if (token.length > 0) return token;
  }
  const cookieToken = readCookie(req, SESSION_COOKIE_NAME);
  if (cookieToken && cookieToken.length > 0) return cookieToken;
  return null;
}

/** إعدادات الكوكي الموحّدة — httpOnly + sameSite=strict للحماية من XSS وسرقة الجلسة و CSRF */
export function sessionCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeMs,
  };
}

/** مسارات عامة لكنها تستفيد من الجلسة إن كانت موجودة (لا تفشل عند غيابها) */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const session = getSession(token);
    if (session) {
      req.auth = session;
      req.authToken = token;
    }
  }
  next();
}

/** يجب وجود جلسة صالحة */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const session = token ? getSession(token) : null;
  if (!session || !token) {
    res.status(401).json({ success: false, error: 'مطلوب تسجيل الدخول' });
    return;
  }
  req.auth = session;
  req.authToken = token;
  next();
}

/** يجب أن تكون الجلسة لموظف، ويمكن حصرها بأدوار محددة */
export function requireStaff(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractToken(req);
    const session = token ? getSession(token) : null;
    if (!session || !token) {
      res.status(401).json({ success: false, error: 'مطلوب تسجيل الدخول' });
      return;
    }
    if (session.kind !== 'staff') {
      res.status(403).json({ success: false, error: 'هذه الصلاحية متاحة للموظفين فقط' });
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role || '')) {
      res.status(403).json({ success: false, error: 'صلاحياتك لا تسمح بهذا الإجراء' });
      return;
    }
    req.auth = session;
    req.authToken = token;
    next();
  };
}

/** مدير النظام فقط */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireStaff('admin')(req, res, next);
}

/** يجب أن تكون الجلسة لطالب */
export function requireStudent(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const session = token ? getSession(token) : null;
  if (!session || !token) {
    res.status(401).json({ success: false, error: 'مطلوب تسجيل الدخول' });
    return;
  }
  if (session.kind !== 'student') {
    res.status(403).json({ success: false, error: 'هذه الصلاحية متاحة لبوابة الطالب فقط' });
    return;
  }
  req.auth = session;
  req.authToken = token;
  next();
}

/** هل الجلسة الحالية موظف؟ */
export function isStaff(req: Request): boolean {
  return req.auth?.kind === 'staff';
}

/** هل الجلسة الحالية مدير؟ */
export function isAdmin(req: Request): boolean {
  return req.auth?.kind === 'staff' && req.auth?.role === 'admin';
}

/**
 * فحص ملكية مورد يخص طالباً:
 * يُسمح للموظفين دائماً، وللطالب فقط إن كان المورد يخص طلبه.
 */
export function canAccessApplication(req: Request, applicationId: number | null | undefined): boolean {
  if (!req.auth) return false;
  if (req.auth.kind === 'staff') return true;
  if (applicationId === null || applicationId === undefined) return false;
  return req.auth.applicationId === applicationId;
}
