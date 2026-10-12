/**
 * ============================================================================
 * تخزين المستندات المرفوعة (Secure Document Storage)
 * ============================================================================
 * ما تغيّر عن النسخة السابقة، ولماذا:
 *
 *   1. الملفات لم تعد تُكتب داخل public/ — أي أنها لم تعد قابلة للوصول
 *      كملفات ثابتة عبر رابط مباشر. تُخزَّن الآن في server/data/uploads
 *      وهو مجلد مستثنى في .gitignore وغير مخدوم إطلاقاً.
 *
 *   2. لم يعد المسار الملفّي يُبنى من مدخلات العميل. يُخزَّن في قاعدة
 *      البيانات معرّف مجرّد بالشكل:  upload:<uuid>.<ext>
 *      ولذلك يستحيل استخدام file_url للخروج من مجلد التخزين
 *      (كان هذا هو مسار "قراءة أي ملف على السيرفر").
 *
 *   3. الامتداد يُشتق من قائمة بيضاء + فحص التوقيع الثنائي (magic bytes)
 *      وليس من اسم الملف الذي يرسله المستخدم.
 *
 *   4. حدّ أقصى للحجم على مستوى التطبيق.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SavedFileResult {
  fileUrl: string;
  fileName: string;
  fileSize: string;
}

/** المجلد الخاص بالمستندات — خارج public/ تماماً */
export const UPLOAD_DIR = path.join(process.cwd(), 'server', 'data', 'uploads', 'documents');

/** المجلدات القديمة — للقراءة فقط، لدعم المستندات المرفوعة قبل الإصلاح */
const LEGACY_DIRS = [
  path.join(process.cwd(), 'public', 'uploads', 'documents'),
  path.join(process.cwd(), 'uploads', 'documents'),
];

/** حد أقصى 10 ميجابايت للمستند الواحد */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** الامتدادات المسموح بها فقط */
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/** أنماط التوقيع الثنائي المعروفة */
const SIGNATURES: Array<{ ext: string; mime: string; test: (b: Buffer) => boolean }> = [
  { ext: '.pdf', mime: 'application/pdf', test: (b) => b.length > 4 && b.subarray(0, 4).toString('latin1') === '%PDF' },
  { ext: '.jpg', mime: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: '.png',
    mime: 'image/png',
    test: (b) =>
      b.length > 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    ext: '.webp',
    mime: 'image/webp',
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

/** كشف النوع الحقيقي من محتوى الملف */
export function detectMime(buffer: Buffer): { ext: string; mime: string } | null {
  for (const sig of SIGNATURES) {
    if (sig.test(buffer)) return { ext: sig.ext, mime: sig.mime };
  }
  return null;
}

/** فك ترميز data: URL أو نص base64 خام */
export function decodeBase64Payload(fileData: string): Buffer | null {
  try {
    if (fileData.startsWith('data:')) {
      const commaIndex = fileData.indexOf(',');
      if (commaIndex === -1) return null;
      const meta = fileData.slice(5, commaIndex);
      if (!meta.includes('base64')) return null;
      return Buffer.from(fileData.slice(commaIndex + 1), 'base64');
    }
    return Buffer.from(fileData, 'base64');
  } catch {
    return null;
  }
}

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * حفظ مستند مرفوع.
 * يُرجع fileUrl بالشكل upload:<uuid>.<ext> — معرّف مجرّد لا يكشف أي مسار.
 */
export function saveUploadedDocument(
  appId: string | number,
  docType: string,
  originalFileName: string,
  fileData: string
): SavedFileResult {
  const buffer = decodeBase64Payload(fileData);
  if (!buffer || buffer.length === 0) {
    throw new Error('بيانات الملف غير صالحة');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`حجم الملف يتجاوز الحد المسموح (${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} ميجابايت)`);
  }

  // النوع من المحتوى نفسه، لا من اسم الملف
  const detected = detectMime(buffer);
  if (!detected) {
    throw new Error('نوع الملف غير مدعوم. المسموح: PDF أو JPG أو PNG أو WEBP');
  }

  // التحقق من الامتداد المُعلن إن وُجد (فحص إضافي لا أساسي)
  const declaredExt = path.extname(originalFileName || '').toLowerCase();
  if (declaredExt && !ALLOWED_EXTENSIONS.has(declaredExt)) {
    throw new Error('امتداد الملف غير مسموح');
  }

  ensureUploadDir();

  // اسم الملف على القرص: معرّف عشوائي — لا يحمل أي جزء من مدخلات المستخدم
  const id = crypto.randomUUID();
  const diskName = `${id}${detected.ext}`;
  const target = path.join(UPLOAD_DIR, diskName);

  // تأكيد نهائي أن المسار داخل مجلد التخزين
  const relative = path.relative(UPLOAD_DIR, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('مسار تخزين غير صالح');
  }

  fs.writeFileSync(target, buffer);

  // اسم العرض للعميل: مُنقّى من أي محارف مسار
  const displayName = path
    .basename(originalFileName || `document${detected.ext}`)
    .replace(/[^\p{L}\p{N}._\- ]/gu, '_')
    .slice(0, 180) || `document${detected.ext}`;

  return {
    fileUrl: `upload:${diskName}`,
    fileName: displayName,
    fileSize: formatSize(buffer.length),
  };
}

/**
 * تحويل قيمة file_url المخزّنة في قاعدة البيانات إلى مسار فعلي آمن.
 * يقبل الصيغة الجديدة upload:<name> والصيغة القديمة /uploads/documents/<name>.
 * يُرجع null لأي قيمة مشبوهة — وهذا ما يمنع قراءة أي ملف خارج مجلد التخزين.
 */
export function resolveStoredFile(fileRef: string | null | undefined): { absolutePath: string; mime: string } | null {
  if (typeof fileRef !== 'string' || fileRef.length === 0) return null;

  const SAFE_NAME = /^[A-Za-z0-9._-]{1,160}$/;

  // الصيغة الجديدة
  if (fileRef.startsWith('upload:')) {
    const name = fileRef.slice('upload:'.length);
    if (!SAFE_NAME.test(name) || name.includes('..')) return null;
    const ext = path.extname(name).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) return null;
    const absolutePath = path.join(UPLOAD_DIR, name);
    const relative = path.relative(UPLOAD_DIR, absolutePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
    return fs.existsSync(absolutePath) ? { absolutePath, mime } : null;
  }

  // الصيغة القديمة: نأخذ اسم الملف فقط ونتجاهل أي مجلد مُعلن
  const legacyName = path.basename(fileRef.replace(/\\/g, '/'));
  if (!SAFE_NAME.test(legacyName) || legacyName.includes('..')) return null;
  const ext = path.extname(legacyName).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;

  for (const dir of [...LEGACY_DIRS, UPLOAD_DIR]) {
    const candidate = path.join(dir, legacyName);
    const relative = path.relative(dir, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { absolutePath: candidate, mime };
    }
  }
  return null;
}

/** حذف فعلي لملف مستند (كان الحذف القديم يُفرّغ المسار ويترك الملف على القرص) */
export function deleteStoredFile(fileRef: string | null | undefined): boolean {
  const resolved = resolveStoredFile(fileRef);
  if (!resolved) return false;
  // لا نحذف من المجلدات القديمة إلا إذا كان الملف داخل مجلد التخزين الجديد
  if (!resolved.absolutePath.startsWith(UPLOAD_DIR)) return false;
  try {
    fs.unlinkSync(resolved.absolutePath);
    return true;
  } catch {
    return false;
  }
}
