/**
 * ============================================================================
 * مسارات الجامعات والبرامج الأكاديمية (Universities & Programs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب قائمة الجامعات مع إمكانية التصفية بحسب الدولة
 * GET /api/universities?country_id=1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { country_id, featured } = req.query;

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
      
      const result = await pool.query(sql, params);
      return res.json({ success: true, source: 'postgres', data: result.rows });
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

    return res.json({ success: true, source: 'in-memory', data: filtered });
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

    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT u.*, 
               c.name_ar as country_name_ar, c.name_en as country_name_en,
               COALESCE(json_agg(m.*) FILTER (WHERE m.id IS NOT NULL), '[]') as majors
        FROM universities u
        LEFT JOIN countries c ON u.country_id = c.id
        LEFT JOIN majors m ON m.university_id = u.id
        WHERE u.id = $1
        GROUP BY u.id, c.id
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
      }
      return res.json({ success: true, data: result.rows[0] });
    }

    const uni = inMemoryStore.universities.find(u => u.id === id);
    if (!uni) return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
    const uniMajors = inMemoryStore.majors.filter(m => m.university_id === id);

    return res.json({ success: true, data: { ...uni, majors: uniMajors } });
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
      return res.status(201).json({ success: true, message: 'تم إضافة الجامعة بنجاح', data: result.rows[0] });
    }

    const countryObj = inMemoryStore.countries.find(c => c.id === parseInt(country_id, 10));
    const newUni = {
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
    inMemoryStore.universities.push(newUni);
    return res.status(201).json({ success: true, message: 'تم إضافة الجامعة بنجاح', data: newUni });
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
      return res.json({ success: true, message: 'تم تعديل الجامعة بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.universities.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
    inMemoryStore.universities[index] = { ...inMemoryStore.universities[index], ...req.body };
    return res.json({ success: true, message: 'تم تعديل الجامعة بنجاح', data: inMemoryStore.universities[index] });
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
      return res.json({ success: true, message: 'تم حذف الجامعة بنجاح' });
    }

    inMemoryStore.universities = inMemoryStore.universities.filter(u => u.id !== id);
    inMemoryStore.majors = inMemoryStore.majors.filter(m => m.university_id !== id);
    return res.json({ success: true, message: 'تم حذف الجامعة بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
