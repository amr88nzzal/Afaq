/**
 * ============================================================================
 * مسارات الجامعات والبرامج الأكاديمية (Universities & Programs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { cacheManager } from '../services/cacheManager';

const router = Router();

/**
 * جلب قائمة الجامعات مع إمكانية التصفية بحسب الدولة
 * GET /api/universities?country_id=1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { country_id, featured } = req.query;
    const cacheKey = `universities:c_${country_id || 'all'}:f_${featured || 'all'}`;

    const result = await cacheManager.getOrFetch(
      cacheKey,
      async () => {
        if (isPostgresConnected) {
          let sql = `
            SELECT u.*, 
                   c.name_ar as country_name_ar, c.name_en as country_name_en, c.code as country_code,
                   COALESCE(json_agg(m.*) FILTER (WHERE m.id IS NOT NULL), '[]') as majors
            FROM universities u
            LEFT JOIN countries c ON u.country_id = c.id
            LEFT JOIN majors m ON m.university_id = u.id
            WHERE 1=1
          `;
          const params: any[] = [];
          if (country_id) {
            params.push(country_id);
            sql += ` AND u.country_id = $${params.length}`;
          }
          if (featured === 'true') {
            sql += ` AND u.featured = true`;
          }
          sql += ' GROUP BY u.id, c.id ORDER BY u.ranking ASC NULLS LAST';
          
          const queryRes = await pool.query(sql, params);
          return queryRes.rows;
        }

        let filtered = inMemoryStore.universities.map(u => ({
          ...u,
          majors: inMemoryStore.majors.filter(m => m.university_id === u.id),
        }));

        if (country_id) {
          filtered = filtered.filter(u => u.country_id === parseInt(country_id as string, 10));
        }
        if (featured === 'true') {
          filtered = filtered.filter(u => u.featured === true);
        }

        return filtered;
      },
      10 * 60 * 1000,
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
    console.error('Error fetching universities:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * جلب تفاصيل جامعة معينة
 * GET /api/universities/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cacheKey = `universities:detail:${id}`;

    const result = await cacheManager.getOrFetch(
      cacheKey,
      async () => {
        if (isPostgresConnected) {
          const queryRes = await pool.query(`
            SELECT u.*, 
                   c.name_ar as country_name_ar, c.name_en as country_name_en,
                   COALESCE(json_agg(m.*) FILTER (WHERE m.id IS NOT NULL), '[]') as majors
            FROM universities u
            LEFT JOIN countries c ON u.country_id = c.id
            LEFT JOIN majors m ON m.university_id = u.id
            WHERE u.id = $1
            GROUP BY u.id, c.id
          `, [id]);
          return queryRes.rows[0] || null;
        }

        const uni = inMemoryStore.universities.find(u => u.id === id);
        if (!uni) return null;
        const uniMajors = inMemoryStore.majors.filter(m => m.university_id === id);

        return { ...uni, majors: uniMajors };
      },
      10 * 60 * 1000,
      isPostgresConnected ? 'postgres' : 'in-memory'
    );

    if (!result.data) {
      return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
    }

    res.setHeader('X-Cache', result.isCached ? 'HIT' : 'MISS');
    res.setHeader('X-Response-Time', `${result.responseTimeMs}ms`);

    return res.json({
      success: true,
      cached: result.isCached,
      data: result.data,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إضافة جامعة جديدة
 * POST /api/universities
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      country_id, name_ar, name_en, city_ar, city_en,
      details_ar, details_en, cost_info, ranking,
      acceptance_rate, featured, website_url, image_url
    } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, error: 'اسم الجامعة بالعربية والإنجليزية مطلوب' });
    }

    let createdData: any = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO universities (
          country_id, name_ar, name_en, city_ar, city_en,
          details_ar, details_en, cost_info, ranking,
          acceptance_rate, featured, website_url, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          country_id || null, name_ar, name_en, city_ar, city_en,
          details_ar, details_en, cost_info, ranking ? parseInt(ranking, 10) : null,
          acceptance_rate, featured ?? false, website_url, image_url
        ]
      );
      createdData = result.rows[0];
    } else {
      const countryObj = inMemoryStore.countries.find(c => c.id === parseInt(country_id, 10));
      createdData = {
        id: Date.now(),
        country_id: country_id ? parseInt(country_id, 10) : 1,
        country_name_ar: countryObj?.name_ar || '',
        country_name_en: countryObj?.name_en || '',
        name_ar,
        name_en,
        city_ar: city_ar || '',
        city_en: city_en || '',
        details_ar: details_ar || '',
        details_en: details_en || '',
        cost_info: cost_info || '',
        ranking: ranking ? parseInt(ranking, 10) : 100,
        acceptance_rate: acceptance_rate || '50%',
        featured: featured ?? false,
        website_url: website_url || '',
        image_url: image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      };
      inMemoryStore.universities.push(createdData);
    }

    cacheManager.invalidateByPrefix('universities');
    return res.status(201).json({ success: true, message: 'تم إضافة الجامعة بنجاح وتحديث الكاش', data: createdData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تعديل بيانات جامعة
 * PUT /api/universities/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      country_id, name_ar, name_en, city_ar, city_en,
      details_ar, details_en, cost_info, ranking,
      acceptance_rate, featured, website_url, image_url
    } = req.body;

    let updatedData: any = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE universities SET
          country_id = COALESCE($1, country_id),
          name_ar = COALESCE($2, name_ar),
          name_en = COALESCE($3, name_en),
          city_ar = COALESCE($4, city_ar),
          city_en = COALESCE($5, city_en),
          details_ar = COALESCE($6, details_ar),
          details_en = COALESCE($7, details_en),
          cost_info = COALESCE($8, cost_info),
          ranking = COALESCE($9, ranking),
          acceptance_rate = COALESCE($10, acceptance_rate),
          featured = COALESCE($11, featured),
          website_url = COALESCE($12, website_url),
          image_url = COALESCE($13, image_url)
        WHERE id = $14
        RETURNING *`,
        [
          country_id, name_ar, name_en, city_ar, city_en,
          details_ar, details_en, cost_info, ranking ? parseInt(ranking, 10) : null,
          acceptance_rate, featured, website_url, image_url, id
        ]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
      updatedData = result.rows[0];
    } else {
      const index = inMemoryStore.universities.findIndex(u => u.id === id);
      if (index === -1) return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
      inMemoryStore.universities[index] = { ...inMemoryStore.universities[index], ...req.body };
      updatedData = inMemoryStore.universities[index];
    }

    cacheManager.invalidateByPrefix('universities');
    return res.json({ success: true, message: 'تم تعديل الجامعة بنجاح وتحديث الكاش', data: updatedData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * حذف جامعة
 * DELETE /api/universities/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isPostgresConnected) {
      await pool.query('DELETE FROM universities WHERE id = $1', [id]);
    } else {
      inMemoryStore.universities = inMemoryStore.universities.filter(u => u.id !== id);
      inMemoryStore.majors = inMemoryStore.majors.filter(m => m.university_id !== id);
    }

    cacheManager.invalidateByPrefix('universities');
    return res.json({ success: true, message: 'تم حذف الجامعة بنجاح وتحديث الكاش' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
