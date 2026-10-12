/**
 * ============================================================================
 * خدمة تشفير كلمات المرور (Password Hashing Service)
 * ============================================================================
 * تستخدم خوارزمية scrypt المدمجة في Node.js (عبر OpenSSL).
 * لا تحتاج أي حزمة خارجية — لا bcrypt ولا argon2 ولا أي تبعية أصلية.
 *
 * الصيغة المخزنة في العمود password_hash:
 *   scrypt$<N>$<r>$<p>$<salt-base64>$<hash-base64>
 *
 * وجود البادئة "scrypt$" هو ما يميّز القيمة المشفّرة عن أي قيمة قديمة
 * مخزّنة كنص صريح، وهذا يسمح بترحيل تدريجي آمن للحسابات القديمة.
 */

import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: crypto.ScryptOptions
) => Promise<Buffer>;

/** معاملات scrypt — N=16384 يُعطي ~100ms لكل عملية، وهو توازن جيد بين الأمان والأداء */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = 'scrypt';

/**
 * قيمة تعني "حساب مقفل بلا كلمة مرور".
 * تُزرع في ملفات SQL والبيانات التجريبية بدل كلمات مرور ثابتة مثل 123456،
 * ولا يمكن أن تطابق أي إدخال لأنها ليست بصمة scrypt ولا نصاً يقبل المقارنة.
 */
export const LOCKED_PASSWORD = '!';

export interface VerifyResult {
  /** هل كلمة المرور صحيحة؟ */
  ok: boolean;
  /**
   * هل القيمة المخزّنة قديمة (نص صريح) ويجب إعادة تشفيرها فوراً؟
   * عند true يجب على المستدعي استدعاء hashPassword وحفظ الناتج.
   */
  needsRehash: boolean;
}

/** مقارنة ثابتة الزمن بين نصين */
function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual يشترط تساوي الطول — نضيف مقارنة الطول بعد المقارنة الثابتة
  if (bufA.length !== bufB.length) {
    // نقوم بعملية مقارنة وهمية للحفاظ على ثبات الزمن ثم نُرجع false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** توليد بصمة scrypt لكلمة مرور جديدة */
export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('كلمة المرور مطلوبة ولا يمكن أن تكون فارغة');
  }
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(plain, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return [
    PREFIX,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

/**
 * التحقق من كلمة المرور مقابل القيمة المخزّنة.
 * يدعم القيم القديمة المخزّنة كنص صريح ويُبلّغ عن الحاجة لإعادة التشفير.
 */
export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<VerifyResult> {
  if (typeof plain !== 'string' || plain.length === 0) {
    return { ok: false, needsRehash: false };
  }
  if (typeof stored !== 'string' || stored.length === 0) {
    return { ok: false, needsRehash: false };
  }

  // حالة قديمة: القيمة مخزّنة كنص صريح (لا بادئة scrypt$)
  if (!stored.startsWith(`${PREFIX}$`)) {
    const ok = safeEqualStrings(plain, stored);
    return { ok, needsRehash: ok };
  }

  const parts = stored.split('$');
  if (parts.length !== 6) {
    return { ok: false, needsRehash: false };
  }

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N <= 0 || r <= 0 || p <= 0) {
    return { ok: false, needsRehash: false };
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch {
    return { ok: false, needsRehash: false };
  }
  if (salt.length === 0 || expected.length === 0) {
    return { ok: false, needsRehash: false };
  }

  try {
    const derived = await scryptAsync(plain, salt, expected.length, { N, r, p });
    if (derived.length !== expected.length) {
      return { ok: false, needsRehash: false };
    }
    const ok = crypto.timingSafeEqual(derived, expected);
    // إعادة التشفير إن تغيّرت معاملاتنا الحالية
    const needsRehash = ok && (N !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P);
    return { ok, needsRehash };
  } catch {
    return { ok: false, needsRehash: false };
  }
}

/** هل القيمة المخزّنة نص صريح قديم؟ (تُستخدم لأغراض الترحيل والتقارير) */
export function isLegacyPlaintext(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.length > 0 && !stored.startsWith(`${PREFIX}$`);
}

/**
 * توليد كلمة مرور عشوائية قوية (تُستخدم بدل القيم الافتراضية مثل 123456).
 * تتجنّب الأحرف المتشابهة بصرياً لتسهيل كتابتها يدوياً عند الحاجة.
 */
export function generateStrongPassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}
