/**
 * ============================================================================
 * مسارات إدارة نصوص ومحتوى الموقع (CMS Paragraphs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع فقرات ونصوص الموقع
 * GET /api/paragraphs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query('SELECT * FROM paragraphs ORDER BY id ASC');
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.paragraphs });
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
      return res.json({ success: true, message: 'تم تحديث النص بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.paragraphs.findIndex(p => p.slug === slug);
    if (index >= 0) {
      inMemoryStore.paragraphs[index] = { ...inMemoryStore.paragraphs[index], ...req.body };
      return res.json({ success: true, message: 'تم تحديث النص بنجاح', data: inMemoryStore.paragraphs[index] });
    }

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
    return res.json({ success: true, message: 'تم حفظ النص بنجاح', data: newPara });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
