/**
 * ============================================================================
 * مسارات إدارة نصوص ومحتوى الموقع (CMS Paragraphs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore, saveStoreToDisk } from '../db';
import { cacheManager } from '../services/cacheManager';

const router = Router();

/**
 * جلب جميع فقرات ونصوص الموقع
 * GET /api/paragraphs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await cacheManager.getOrFetch(
      'paragraphs',
      async () => {
        if (isPostgresConnected) {
          const queryRes = await pool.query('SELECT * FROM paragraphs ORDER BY id ASC');
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
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث فقرة أو نص في الموقع
 * PUT /api/paragraphs/:slug
 */
router.put('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { title_ar, title_en, text_ar, text_en, section_name } = req.body;

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
      const index = inMemoryStore.paragraphs.findIndex(p => p.slug === slug);
      if (index >= 0) {
        inMemoryStore.paragraphs[index] = { ...inMemoryStore.paragraphs[index], ...req.body };
        updatedData = inMemoryStore.paragraphs[index];
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

    // إذا كان النص المعدل هو الشريط العلوي للتنبيهات، نقوم بتحديث الإعدادات العامة والحفظ في القرص مباشرة
    if (slug === 'announcement' || slug === 'announcement_banner') {
      if (text_ar) inMemoryStore.settings.announcement_banner_ar = text_ar;
      if (text_en) inMemoryStore.settings.announcement_banner_en = text_en;
    }

    // حفظ التغييرات في القرص وإبطال الكاش فوراً
    saveStoreToDisk();
    cacheManager.invalidate('paragraphs');
    cacheManager.invalidate('settings');

    return res.json({ success: true, message: 'تم تحديث النص بنجاح وتحديث الكاش فوراً', data: updatedData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
