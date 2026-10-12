/**
 * ============================================================================
 * مسارات التحكم في إعدادات ومعطيات المنصة (Site Settings & Dynamic Content API)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   - GET /api/settings عام (لأن الموقع العام يحتاجه) لكنه يُخفي أي مفتاح
 *     يبدو سرّياً. في النسخة السابقة كان SELECT * يُعيد telegram_bot_token
 *     لأي زائر مجهول بمجرد أن يحفظه المشرف من لوحة التحكم.
 *   - PUT /api/settings محصور بالمدير، ويرفض كتابة المفاتيح السرّية
 *     (مكانها متغيّرات البيئة لا جدول الإعدادات العام).
 *   - رُفضت مفاتيح التلويث النمطي (__proto__ وما شابه).
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { cacheManager } from '../services/cacheManager';
import { requireAdmin } from '../middleware/auth';
import { failInternal } from '../middleware/security';

const router = Router();

/**
 * أي مفتاح يطابق هذا النمط لا يُعاد للعميل ولا يُقبل في الكتابة.
 */
const SECRET_KEY_PATTERN = /(token|secret|password|passwd|api[_-]?key|credential|private[_-]?key|chat[_-]?id)/i;

/**
 * قائمة صريحة بأسماء المفاتيح السرّية المعروفة في هذا المشروع.
 * السبب: الاعتماد على النمط وحده لا يكفي — `telegram_chat_id` لا يحتوي كلمة
 * token ولا secret، فكان يمرّ من الفلتر ويُسرَّب معرّف قناة الإدارة للعامة.
 */
const SECRET_KEY_NAMES = new Set([
  'telegram_bot_token',
  'telegram_chat_id',
  'gmail_app_password',
  'smtp_pass',
  'smtp_password',
  'gemini_api_key',
]);

function isSecretKey(key: string): boolean {
  return SECRET_KEY_NAMES.has(key.toLowerCase()) || SECRET_KEY_PATTERN.test(key);
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * إخفاء القيم السرّية في أي كائن إعدادات.
 * المفاتيح السرّية تُحذف كلياً من الاستجابة (لا تُعاد حتى باسمها) — فلا يعرف
 * الزائر المجهول أي أسرار مُهيّأة على السيرفر، ولا تُسرَّب قيمها.
 */
function redactSecrets(source: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(source)) {
    if (isSecretKey(key)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * جلب الإعدادات العامة للموقع (بدون أي قيم سرّية)
 * GET /api/settings
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await cacheManager.getOrFetch(
      'settings',
      async () => {
        if (isPostgresConnected) {
          let rows: any[] = [];
          try {
            const queryRes = await pool.query(
              'SELECT key, value, value_ar, value_en, value_numeric FROM settings'
            );
            rows = queryRes.rows;
          } catch {
            const queryRes2 = await pool.query(
              'SELECT key, value, value_ar, value_en, value_numeric FROM site_settings'
            );
            rows = queryRes2.rows;
          }

          const settingsObj: Record<string, any> = {};
          rows.forEach((row) => {
            const mainVal = row.value ?? row.value_ar ?? row.value_en ?? row.value_numeric;
            if (row.key) {
              settingsObj[row.key] = mainVal !== undefined && mainVal !== null ? String(mainVal) : '';
              if (row.value_ar) settingsObj[`${row.key}_ar`] = row.value_ar;
              if (row.value_en) settingsObj[`${row.key}_en`] = row.value_en;
            }
          });

          return redactSecrets({ ...inMemoryStore.settings, ...settingsObj });
        }
        return redactSecrets({ ...inMemoryStore.settings });
      },
      15 * 60 * 1000,
      isPostgresConnected ? 'postgres' : 'in-memory'
    );

    res.setHeader('X-Cache', result.isCached ? 'HIT' : 'MISS');
    res.setHeader('X-Response-Time', `${result.responseTimeMs}ms`);

    return res.json({
      success: true,
      cached: result.isCached,
      source: result.isCached ? 'active-server-cache' : (isPostgresConnected ? 'postgres' : 'in-memory'),
      // التقنيع يُطبَّق هنا أيضاً وليس في مُنتِج الكاش فقط.
      // السبب: معالج PUT يخزّن نسخة في الكاش، فلو خُزّنت غير مُقنَّعة لأعاد
      // GET القيم السرّية من الكاش مباشرة متجاوزاً التقنيع.
      data: redactSecrets(result.data as Record<string, any>),
      responseTimeMs: result.responseTimeMs,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(200).json({
      success: true,
      source: 'in-memory-fallback',
      data: redactSecrets({ ...inMemoryStore.settings }),
    });
  }
});

/**
 * تحديث الإعدادات — للمدير فقط
 * PUT /api/settings
 */
router.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ success: false, error: 'بيانات غير صالحة' });
    }

    // تصفية المفاتيح: نرفض المفاتيح السرّية ومفاتيح التلويث النمطي
    const accepted: Record<string, any> = {};
    const rejected: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (FORBIDDEN_KEYS.has(key) || isSecretKey(key)) {
        rejected.push(key);
        continue;
      }
      accepted[key] = value;
    }

    if (rejected.length > 0) {
      console.warn(`⚠️ [Settings] تم رفض مفاتيح محظورة: ${rejected.join(', ')}`);
    }
    if (Object.keys(accepted).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لا توجد حقول صالحة للتحديث. المفاتيح السرّية تُضبط من متغيرات البيئة لا من هنا.',
      });
    }

    // تحديث المخزن في الذاكرة
    inMemoryStore.settings = { ...inMemoryStore.settings, ...accepted };

    if (isPostgresConnected) {
      for (const [k, v] of Object.entries(accepted)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && ('ar' in v || 'en' in v)) {
          const valObj = v as any;
          await pool.query(
            `INSERT INTO settings (key, value_ar, value_en, value_numeric, category)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (key) DO UPDATE SET
               value_ar = EXCLUDED.value_ar,
               value_en = EXCLUDED.value_en,
               value_numeric = EXCLUDED.value_numeric,
               category = EXCLUDED.category`,
            [k, valObj.ar || null, valObj.en || null, valObj.numeric || null, valObj.category || null]
          );
        } else {
          const valStr = typeof v === 'string' ? v : JSON.stringify(v);
          await pool.query(
            `INSERT INTO settings (key, value_ar, value_en, category)
             VALUES ($1, $2, $3, 'general')
             ON CONFLICT (key) DO UPDATE SET
               value_ar = EXCLUDED.value_ar,
               value_en = EXCLUDED.value_en`,
            [k, valStr, valStr]
          );
        }
      }
    }

    // مزامنة شريط التنبيه مع فقرة الـ CMS.
    //
    // ⚠️ كانت هذه المزامنة تُحدّث المخزن في الذاكرة فقط **ولا تكتب في جدول
    // paragraphs في PostgreSQL**، فبقي النص القديم معروضاً على الموقع الحيّ:
    // الشريط عرض «55%» بينما الإعدادات تقول «40%»، وأي تعديل من لوحة التحكم
    // لم يكن يظهر إطلاقاً. الآن تُكتب القيمة في القاعدة أيضاً.
    if (accepted.announcement_banner_ar || accepted.announcement_banner_en) {
      const annSlugs = ['announcement', 'announcement_banner'];
      const annIndex = inMemoryStore.paragraphs.findIndex((p) => annSlugs.includes(p.slug));
      if (annIndex >= 0) {
        if (accepted.announcement_banner_ar) inMemoryStore.paragraphs[annIndex].text_ar = accepted.announcement_banner_ar;
        if (accepted.announcement_banner_en) inMemoryStore.paragraphs[annIndex].text_en = accepted.announcement_banner_en;
      }

      if (isPostgresConnected) {
        try {
          for (const slug of annSlugs) {
            const upd = await pool.query(
              `UPDATE paragraphs
                  SET text_ar = COALESCE($2, text_ar),
                      text_en = COALESCE($3, text_en),
                      updated_at = NOW()
                WHERE slug = $1`,
              [slug, accepted.announcement_banner_ar || null, accepted.announcement_banner_en || null]
            );
            if (upd.rowCount && upd.rowCount > 0) {
              console.log(`🔄 [Settings] تمت مزامنة فقرة التنبيه "${slug}" مع الإعدادات`);
            }
          }
        } catch (syncErr) {
          // لا نُفشل حفظ الإعدادات بسبب فشل المزامنة؛ الشريط يقرأ من
          // الإعدادات أولاً، والفقرة احتياطية فقط.
          console.warn('⚠️ [Settings] تعذّرت مزامنة فقرة التنبيه مع قاعدة البيانات:', syncErr);
        }
      }
    }

    saveStoreToDisk();
    cacheManager.invalidate('settings');
    cacheManager.invalidate('paragraphs');
    // ⛔ لا تُخزَّن القيم السرّية في الكاش إطلاقاً — وإلا أعادها GET لاحقاً.
    cacheManager.set('settings', redactSecrets({ ...inMemoryStore.settings }), 15 * 60 * 1000);

    console.log('⚡ [Cache Invalidated & Updated] تم تحديث كاش إعدادات النظام فوراً:', Object.keys(accepted));
    return res.json({
      success: true,
      message: 'تم حفظ وتحديث الإعدادات بنجاح',
      data: redactSecrets({ ...inMemoryStore.settings }),
      ...(rejected.length > 0 ? { rejectedKeys: rejected } : {}),
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

export default router;
