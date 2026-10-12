/**
 * ============================================================================
 * مسارات إدارة نصوص ومحتوى الموقع (CMS Paragraphs API)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   GET عام لأن الموقع العام يقرأ النصوص، أما PUT فمحصور بالمدير
 *   (كان أي شخص يستطيع إعادة كتابة محتوى الموقع بالكامل).
 *   أُزيل أيضاً دمج req.body العشوائي في المخزن.
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { cacheManager } from '../services/cacheManager';
import { requireAdmin } from '../middleware/auth';
import { failInternal } from '../middleware/security';

const router = Router();

/**
 * جلب جميع فقرات ونصوص الموقع — عام (يقرأه الموقع العام)
 * GET /api/paragraphs
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await cacheManager.getOrFetch(
      'paragraphs',
      async () => {
        if (isPostgresConnected) {
          const queryRes = await pool.query(
            'SELECT id, slug, section_name, title_ar, title_en, text_ar, text_en FROM paragraphs ORDER BY id ASC'
          );
          return queryRes.rows;
        }
        return inMemoryStore.paragraphs;
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
      data: result.data,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (error) {
    return failInternal(res, error);
  }
});

/**
 * تحديث فقرة أو نص في الموقع — للمدير فقط
 * PUT /api/paragraphs/:slug
 */
router.put('/:slug', requireAdmin, async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug).slice(0, 120);
    const { title_ar, title_en, text_ar, text_en, section_name } = req.body || {};

    let updatedData: any = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO paragraphs (slug, section_name, title_ar, title_en, text_ar, text_en, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           section_name = COALESCE(EXCLUDED.section_name, paragraphs.section_name),
           title_ar = COALESCE(EXCLUDED.title_ar, paragraphs.title_ar),
           title_en = COALESCE(EXCLUDED.title_en, paragraphs.title_en),
           text_ar = EXCLUDED.text_ar,
           text_en = EXCLUDED.text_en,
           updated_at = NOW()
         RETURNING *`,
        [slug, section_name || 'عام', title_ar, title_en, text_ar, text_en]
      );
      updatedData = result.rows[0];
    } else {
      const index = inMemoryStore.paragraphs.findIndex((p) => p.slug === slug);
      if (index >= 0) {
        // تحديث حقول محدّدة فقط — لا spread لـ req.body
        const target = inMemoryStore.paragraphs[index];
        if (section_name !== undefined) target.section_name = section_name;
        if (title_ar !== undefined) target.title_ar = title_ar;
        if (title_en !== undefined) target.title_en = title_en;
        if (text_ar !== undefined) target.text_ar = text_ar;
        if (text_en !== undefined) target.text_en = text_en;
        updatedData = target;
      } else {
        const newPara = {
          id: Date.now(),
          slug,
          section_name: section_name || 'عام',
          title_ar: title_ar || slug,
          title_en: title_en || slug,
          text_ar: text_ar || '',
          text_en: text_en || '',
        };
        inMemoryStore.paragraphs.push(newPara);
        updatedData = newPara;
      }
    }

    // إذا كان النص المعدل هو الشريط العلوي للتنبيهات، نحدّث الإعدادات العامة
    if (slug === 'announcement' || slug === 'announcement_banner') {
      if (text_ar) inMemoryStore.settings.announcement_banner_ar = text_ar;
      if (text_en) inMemoryStore.settings.announcement_banner_en = text_en;
    }

    saveStoreToDisk();
    cacheManager.invalidate('paragraphs');
    cacheManager.invalidate('settings');

    return res.json({ success: true, message: 'تم تحديث النص بنجاح وتحديث الكاش فوراً', data: updatedData });
  } catch (error) {
    return failInternal(res, error);
  }
});

export default router;
