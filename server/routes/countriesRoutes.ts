/**
 * ============================================================================
 * مسارات إدارة الدول والوجهات الدراسية (Countries API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { cacheManager } from '../services/cacheManager';
import { requireAdmin } from '../middleware/auth';
import { failInternal } from '../middleware/security';

const router = Router();

/**
 * جلب جميع الدول والوجهات الدراسية — عام (يقرأه الموقع العام)
 * GET /api/countries
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await cacheManager.getOrFetch(
      'countries',
      async () => {
        if (isPostgresConnected) {
          const queryRes = await pool.query('SELECT * FROM countries ORDER BY id ASC');
          return queryRes.rows;
        }
        return inMemoryStore.countries;
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
    console.error('Error fetching countries:', error);
    return res.status(200).json({ success: true, source: 'in-memory-fallback', data: inMemoryStore.countries });
  }
});

/**
 * إضافة دولة دراسية جديدة — للمدير فقط
 * POST /api/countries
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { code, name_ar, name_en, info_ar, info_en, image_url, is_active } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, error: 'الاسم بالعربية والإنجليزية مطلوب' });
    }

    let createdData: any = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO countries (code, name_ar, name_en, info_ar, info_en, image_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [code || name_en.toLowerCase().replace(/\s+/g, '-'), name_ar, name_en, info_ar, info_en, image_url, is_active ?? true]
      );
      createdData = result.rows[0];
    } else {
      createdData = {
        id: Date.now(),
        code: code || name_en.toLowerCase().replace(/\s+/g, '-'),
        name_ar,
        name_en,
        info_ar,
        info_en,
        image_url,
        is_active: is_active ?? true,
      };
      inMemoryStore.countries.push(createdData);
    }

    cacheManager.invalidate('countries');
    return res.status(201).json({ success: true, message: 'تم إضافة الدولة بنجاح', data: createdData });
  } catch (error: any) {
    return failInternal(res, error);
  }
});

/**
 * تعديل بيانات دولة — للمدير فقط
 * PUT /api/countries/:id
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { code, name_ar, name_en, info_ar, info_en, image_url, is_active } = req.body;
    let updatedData: any = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE countries SET
           code = COALESCE($1, code),
           name_ar = COALESCE($2, name_ar),
           name_en = COALESCE($3, name_en),
           info_ar = COALESCE($4, info_ar),
           info_en = COALESCE($5, info_en),
           image_url = COALESCE($6, image_url),
           is_active = COALESCE($7, is_active)
         WHERE id = $8
         RETURNING *`,
        [
          code ?? null,
          name_ar ?? null,
          name_en ?? null,
          info_ar ?? null,
          info_en ?? null,
          image_url ?? null,
          is_active !== undefined ? is_active : null,
          id
        ]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الدولة غير موجودة' });
      updatedData = result.rows[0];
    } else {
      const index = inMemoryStore.countries.findIndex(c => Number(c.id) === id);
      if (index === -1) return res.status(404).json({ success: false, error: 'الدولة غير موجودة' });
      const target = inMemoryStore.countries[index] as any;
      if (code !== undefined) target.code = code;
      if (name_ar !== undefined) target.name_ar = name_ar;
      if (name_en !== undefined) target.name_en = name_en;
      if (info_ar !== undefined) target.info_ar = info_ar;
      if (info_en !== undefined) target.info_en = info_en;
      if (image_url !== undefined) target.image_url = image_url;
      if (is_active !== undefined) target.is_active = is_active;
      updatedData = target;
    }

    cacheManager.invalidate('countries');
    return res.json({ success: true, message: 'تم تعديل الدولة بنجاح', data: updatedData });
  } catch (error: any) {
    return failInternal(res, error);
  }
});

/**
 * حذف دولة — للمدير فقط
 * DELETE /api/countries/:id
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isPostgresConnected) {
      try {
        await pool.query('UPDATE universities SET country_id = NULL WHERE country_id = $1', [id]);
      } catch (e: any) {
        console.warn('Could not nullify universities.country_id:', e.message);
      }

      try {
        await pool.query('UPDATE applications SET country_id = NULL WHERE country_id = $1', [id]);
      } catch (e: any) {
        console.warn('Could not nullify applications.country_id:', e.message);
      }

      await pool.query('DELETE FROM countries WHERE id = $1 RETURNING id', [id]);
    }

    inMemoryStore.countries = inMemoryStore.countries.filter(c => Number(c.id) !== id);
    cacheManager.invalidate('countries');
    cacheManager.invalidateByPrefix('universities');

    return res.json({ success: true, message: 'تم حذف الدولة بنجاح' });
  } catch (error: any) {
    return failInternal(res, error);
  }
});

export default router;
