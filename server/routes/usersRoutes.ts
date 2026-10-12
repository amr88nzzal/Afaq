/**
 * ============================================================================
 * مسارات إدارة المستخدمين والمستشارين (Staff & Users API)
 * ============================================================================
 * ملاحظات أمنية مهمّة على هذه النسخة:
 *   - أُزيلت كلمات المرور العامة (afaq2026 / admin123) التي كانت تفتح أي حساب.
 *   - كلمات المرور تُقارن عبر scrypt وليس نصاً صريحاً، مع ترحيل تلقائي
 *     لأي حساب قديم ما زال مخزّناً كنص صريح.
 *   - الجلسات رموز عشوائية غير قابلة للتخمين، ولا تُخزَّن قيمتها الأصلية.
 *   - كل عمليات القراءة/الإضافة/التعديل/الحذف محصورة بالمدير (requireAdmin).
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { hashPassword, verifyPassword, isLegacyPlaintext, generateStrongPassword, LOCKED_PASSWORD } from '../services/passwordService';
import {
  createSession,
  destroySession,
  destroySessionsForUser,
  STAFF_SESSION_TTL_MS,
} from '../services/sessionService';
import {
  requireAdmin,
  requireAuth,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../middleware/auth';
import { rateLimit, failInternal } from '../middleware/security';

const router = Router();

const VALID_ROLES = ['admin', 'counselor', 'staff'];

/** شكل المستخدم الآمن المُعاد للعميل — لا يحتوي أي حقل كلمة مرور */
interface SafeUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  telegram_id?: string | null;
  is_active: boolean;
  created_at?: string;
}

function toSafeUser(row: any): SafeUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    role: row.role,
    telegram_id: row.telegram_id ?? null,
    is_active: row.is_active !== false,
    created_at: row.created_at,
  };
}

/**
 * تجهيز حسابات النسخة الاحتياطية (عند تعذّر الاتصال بـ PostgreSQL).
 * كلمة المرور الافتراضية تُولَّد عشوائياً وتُطبع مرة واحدة، بدل تثبيتها في الكود.
 */
let inMemoryUsersReady = false;
async function ensureInMemoryUsers(): Promise<void> {
  if (inMemoryUsersReady) return;
  const configured = process.env.INITIAL_ADMIN_PASSWORD;
  const adminPassword = configured && configured.length >= 8 ? configured : generateStrongPassword(16);

  for (const user of inMemoryStore.users as any[]) {
    if (!user.password_hash || user.password_hash === LOCKED_PASSWORD) {
      user.password_hash = await hashPassword(
        user.role === 'admin' ? adminPassword : generateStrongPassword(16)
      );
    }
  }
  inMemoryUsersReady = true;

  if (!configured) {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('⚠️  لم يتم ضبط INITIAL_ADMIN_PASSWORD — تم توليد كلمة مرور مؤقتة:');
    console.warn(`🔑  ${adminPassword}`);
    console.warn('👉  سجّل الدخول بها ثم غيّرها فوراً، أو اضبط INITIAL_ADMIN_PASSWORD في .env');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

/**
 * تسجيل دخول الموظفين والمشرفين
 * POST /api/users/login
 * محدود المعدّل لمنع التخمين الآلي.
 */
router.post(
  '/login',
  rateLimit({
    name: 'staff-login',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'عدد محاولات الدخول كبير جداً. حاول مرة أخرى بعد 15 دقيقة.',
  }),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body || {};
      const identifier = String(username || email || '').trim();
      const plainPassword = typeof password === 'string' ? password : '';

      if (!identifier || !plainPassword) {
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور',
        });
      }

      // رد موحّد لجميع حالات الفشل — لا نكشف إن كان الحساب موجوداً أم لا
      const invalid = () => res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });

      if (isPostgresConnected) {
        const result = await pool.query(
          `SELECT id, name, email, phone, role, telegram_id, is_active, password_hash, created_at
           FROM users
           WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)
           LIMIT 1`,
          [identifier]
        );

        if (result.rows.length === 0) return invalid();
        const user = result.rows[0];

        if (user.is_active === false) {
          return res.status(403).json({ success: false, error: 'تم تعطيل هذا الحساب من قبل إدارة النظام' });
        }
        if (!user.password_hash || user.password_hash === LOCKED_PASSWORD) {
          return invalid();
        }

        const verdict = await verifyPassword(plainPassword, user.password_hash);
        if (!verdict.ok) return invalid();

        // ترحيل شفّاف: إن كانت كلمة المرور مخزّنة كنص صريح، نُشفّرها الآن
        if (verdict.needsRehash || isLegacyPlaintext(user.password_hash)) {
          try {
            const upgraded = await hashPassword(plainPassword);
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgraded, user.id]);
            console.log(`🔐 [Auth] تم ترحيل كلمة مرور المستخدم #${user.id} إلى scrypt`);
          } catch (migErr) {
            console.error('⚠️ [Auth] فشل ترحيل كلمة المرور:', migErr);
          }
        }

        const safeUser = toSafeUser(user);
        const { token } = createSession(
          {
            kind: 'staff',
            userId: safeUser.id,
            role: safeUser.role,
            name: safeUser.name,
            email: safeUser.email,
          },
          STAFF_SESSION_TTL_MS
        );

        res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(STAFF_SESSION_TTL_MS));
        return res.json({
          success: true,
          message: `مرحباً بك ${safeUser.name}`,
          user: safeUser,
          token,
          expiresInMs: STAFF_SESSION_TTL_MS,
        });
      }

      // النسخة الاحتياطية في الذاكرة
      await ensureInMemoryUsers();
      const lowerId = identifier.toLowerCase();
      const user = (inMemoryStore.users as any[]).find(
        (u) =>
          String(u.email || '').toLowerCase() === lowerId ||
          String(u.name || '').toLowerCase() === lowerId
      );

      if (!user) return invalid();
      if (user.is_active === false) {
        return res.status(403).json({ success: false, error: 'تم تعطيل هذا الحساب من قبل إدارة النظام' });
      }

      const verdict = await verifyPassword(plainPassword, user.password_hash);
      if (!verdict.ok) return invalid();

      if (verdict.needsRehash) {
        user.password_hash = await hashPassword(plainPassword);
        saveStoreToDisk();
      }

      const safeUser = toSafeUser(user);
      const { token } = createSession(
        {
          kind: 'staff',
          userId: safeUser.id,
          role: safeUser.role,
          name: safeUser.name,
          email: safeUser.email,
        },
        STAFF_SESSION_TTL_MS
      );

      res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(STAFF_SESSION_TTL_MS));
      return res.json({
        success: true,
        message: `مرحباً بك ${safeUser.name}`,
        user: safeUser,
        token,
        expiresInMs: STAFF_SESSION_TTL_MS,
      });
    } catch (error) {
      return failInternal(res, error);
    }
  }
);

/**
 * التحقق من الجلسة الحالية
 * GET /api/users/me
 * تستخدمه الواجهة لمعرفة هوية المستخدم من الخادم بدل الوثوق بما في المتصفح.
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const auth = req.auth!;
  return res.json({
    success: true,
    user: {
      id: auth.userId,
      name: auth.name,
      email: auth.email,
      role: auth.role,
      is_active: true,
    },
  });
});

/**
 * تسجيل الخروج وإبطال الجلسة فوراً
 * POST /api/users/logout
 */
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  destroySession(req.authToken);
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

/**
 * جلب قائمة الموظفين والمستشارين — للمدير فقط
 * GET /api/users
 */
router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT id, name, email, phone, role, telegram_id, is_active, created_at FROM users ORDER BY id ASC'
      );
      return res.json({ success: true, source: 'postgres', data: result.rows.map(toSafeUser) });
    }
    return res.json({
      success: true,
      source: 'in-memory',
      data: (inMemoryStore.users as any[]).map(toSafeUser),
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * إضافة مستشار أو مشرف جديد — للمدير فقط
 * POST /api/users
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, telegram_id } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'الاسم والبريد الإلكتروني حقول إلزامية' });
    }
    const safeRole = VALID_ROLES.includes(role) ? role : 'counselor';

    // كلمة المرور: المُدخلة إن وُجدت، وإلا كلمة عشوائية قوية (لا قيمة افتراضية ثابتة)
    const passwordProvided = typeof password === 'string' && password.length > 0;
    if (passwordProvided && password.length < 8) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }
    const rawPassword = passwordProvided ? password : generateStrongPassword(16);
    const passwordHash = await hashPassword(rawPassword);

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, role, telegram_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, name, email, phone, role, telegram_id, is_active, created_at`,
        [name, email, phone, passwordHash, safeRole, telegram_id]
      );
      return res.status(201).json({
        success: true,
        message: 'تم إضافة المستخدم بنجاح',
        data: toSafeUser(result.rows[0]),
        // تُعاد كلمة المرور المولَّدة مرة واحدة فقط حتى يتمكن المدير من تسليمها
        ...(passwordProvided ? {} : { generatedPassword: rawPassword }),
      });
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      role: safeRole,
      telegram_id,
      password_hash: passwordHash,
      is_active: true,
    };
    (inMemoryStore.users as any[]).push(newUser);
    saveStoreToDisk();
    return res.status(201).json({
      success: true,
      message: 'تم إضافة المستخدم بنجاح',
      data: toSafeUser(newUser),
      ...(passwordProvided ? {} : { generatedPassword: rawPassword }),
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * تعديل بيانات مستخدم — للمدير فقط
 * PUT /api/users/:id
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'معرّف المستخدم غير صالح' });
    }

    const { name, email, phone, password, role, telegram_id, is_active } = req.body || {};
    const safeRole = role !== undefined ? (VALID_ROLES.includes(role) ? role : null) : undefined;
    if (role !== undefined && safeRole === null) {
      return res.status(400).json({ success: false, error: 'الدور غير صالح' });
    }

    // منع المدير من تعطيل حسابه أو خفض دوره (يمنع فقدان آخر مدير)
    if (req.auth?.userId === id) {
      if (is_active === false) {
        return res.status(400).json({ success: false, error: 'لا يمكنك تعطيل حسابك الخاص' });
      }
      if (safeRole !== undefined && safeRole !== null && safeRole !== 'admin') {
        return res.status(400).json({ success: false, error: 'لا يمكنك تغيير دورك الخاص' });
      }
    }

    const passwordProvided = typeof password === 'string' && password.length > 0;
    if (passwordProvided && password.length < 8) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }
    const newPasswordHash = passwordProvided ? await hashPassword(password) : null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE users SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           password_hash = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE password_hash END,
           role = COALESCE($5, role),
           telegram_id = COALESCE($6, telegram_id),
           is_active = COALESCE($7, is_active)
         WHERE id = $8
         RETURNING id, name, email, phone, role, telegram_id, is_active, created_at`,
        [name, email, phone, newPasswordHash, safeRole, telegram_id, is_active, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
      }
      // إبطال جلسات المستخدم عند تغيير كلمة المرور أو تعطيل الحساب
      if (newPasswordHash || is_active === false) {
        destroySessionsForUser(id);
      }
      return res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح', data: toSafeUser(result.rows[0]) });
    }

    const list = inMemoryStore.users as any[];
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });

    // تحديث حقول محدّدة فقط — لا دمج عشوائي لـ req.body
    const target = list[index];
    if (name !== undefined) target.name = name;
    if (email !== undefined) target.email = email;
    if (phone !== undefined) target.phone = phone;
    if (telegram_id !== undefined) target.telegram_id = telegram_id;
    if (safeRole !== undefined && safeRole !== null) target.role = safeRole;
    if (is_active !== undefined) target.is_active = is_active;
    if (newPasswordHash) target.password_hash = newPasswordHash;

    if (newPasswordHash || is_active === false) {
      destroySessionsForUser(id);
    }
    saveStoreToDisk();
    return res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح', data: toSafeUser(target) });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * حذف مستخدم — للمدير فقط
 * DELETE /api/users/:id
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, error: 'معرّف المستخدم غير صالح' });
    }
    if (req.auth?.userId === id) {
      return res.status(400).json({ success: false, error: 'لا يمكنك حذف حسابك الخاص' });
    }

    if (isPostgresConnected) {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
      }
      destroySessionsForUser(id);
      return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    }

    const before = (inMemoryStore.users as any[]).length;
    inMemoryStore.users = (inMemoryStore.users as any[]).filter((u) => u.id !== id);
    if ((inMemoryStore.users as any[]).length === before) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }
    destroySessionsForUser(id);
    saveStoreToDisk();
    return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    return failInternal(res, error);
  }
});

export default router;
