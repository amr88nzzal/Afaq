/**
 * ============================================================================
 * وسطاء الحماية العامة (Security Middleware)
 * ============================================================================
 * يوفّر ما كان غائباً تماماً عن المشروع:
 *   - securityHeaders : رؤوس حماية أساسية (بديل خفيف عن helmet بلا اعتماديات)
 *   - rateLimit       : حد لمعدّل الطلبات (بديل خفيف عن express-rate-limit)
 *   - sanitizeError   : يمنع تسريب رسائل أخطاء قاعدة البيانات للعميل
 */

import { Request, Response, NextFunction } from 'express';

/**
 * رؤوس الحماية. تعمل حتى لو لم يُضبط TLS في nginx، وتصبح كاملة بعده.
 * ملاحظة: HSTS يُرسل فقط عند الطلب عبر HTTPS حتى لا نُقفل الموقع على HTTP
 * أثناء التطوير المحلي.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // لا نكشف أن الخادم Express
  res.removeHeader('X-Powered-By');

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (isHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }

  // سياسة محتوى: تسمح بموارد الموقع نفسه + الصور الخارجية المستخدمة في التصميم
  // (unsafe-inline مطلوبة لأن Tailwind/React تُدرج أنماطاً مضمّنة)
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  next();
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** رسالة الخطأ المعروضة */
  message?: string;
  /** اسم المجموعة لعزل العدّادات */
  name: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Map<string, Bucket>>();

/** تنظيف العدّادات المنتهية دورياً حتى لا تنمو الذاكرة بلا حد */
const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [groupName, group] of buckets) {
    for (const [key, bucket] of group) {
      if (bucket.resetAt <= now) group.delete(key);
    }
    if (group.size === 0) buckets.delete(groupName);
  }
}, 5 * 60 * 1000);
if (typeof rateLimitCleanup.unref === 'function') {
  rateLimitCleanup.unref();
}

/**
 * تحديد هوية العميل لأغراض تحديد المعدّل.
 *
 * ⚠️ مهم مع Cloudflare Tunnel: لا يجوز الاعتماد على أول عنصر في
 * X-Forwarded-For. السبب أن Cloudflare **تُضيف** عنوان العميل إلى أي
 * X-Forwarded-For موجودة في الطلب، فأي مهاجم يرسل `X-Forwarded-For: 1.2.3.4`
 * يجعل أول عنصر عنواناً مزوّراً — وبذلك يتجاوز تحديد المعدّل بالكامل
 * (كل محاولة تبدو من عنوان مختلف).
 *
 * الحل: الاعتماد على CF-Connecting-IP الذي تكتبه حافة Cloudflare وتستبدله
 * دائماً، فلا يمكن للعميل تزويره.
 */
function clientKey(req: Request): string {
  // 1. Cloudflare — الترويسة الموثوقة (تُستبدل على الحافة دائماً)
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  // 2. ترويسة nginx التي يضبطها من $remote_addr (أقرب قفزة إلينا)
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim();
  }

  // 3. آخر عنصر في X-Forwarded-For (أقرب قفزة، لا الأول القابل للتزوير)
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return req.socket.remoteAddress || req.ip || 'unknown';
}

/**
 * محدّد معدّل بسيط في الذاكرة.
 * يُستخدم أساساً على مسارات تسجيل الدخول لمنع التخمين الآلي.
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message, name } = options;
  if (!buckets.has(name)) buckets.set(name, new Map());
  const group = buckets.get(name)!;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = clientKey(req);
    const now = Date.now();
    let bucket = group.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      group.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        success: false,
        error: message || `عدد المحاولات كبير جداً. حاول مرة أخرى بعد ${Math.ceil(retryAfterSec / 60)} دقيقة.`,
      });
      return;
    }

    next();
  };
}

/**
 * تسجيل الخطأ داخلياً وإرجاع رسالة عامة للعميل.
 * هذا يمنع تسريب أسماء الجداول والأعمدة وبنية قاعدة البيانات عبر error.message.
 */
export function fail(res: Response, status: number, publicMessage: string, error?: unknown): void {
  const tag = `[${new Date().toISOString()}]`;
  if (error instanceof Error) {
    console.error(`${tag} ${publicMessage} ::`, error.message);
  } else if (error !== undefined) {
    console.error(`${tag} ${publicMessage} ::`, error);
  } else {
    console.error(`${tag} ${publicMessage}`);
  }
  res.status(status).json({ success: false, error: publicMessage });
}

/** مساعد مختصر للأخطاء الداخلية غير المتوقعة */
export function failInternal(res: Response, error?: unknown): void {
  fail(res, 500, 'حدث خطأ في الخادم، حاول لاحقاً', error);
}
