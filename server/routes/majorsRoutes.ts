/**
 * ============================================================================
 * مسارات إدارة التخصصات والبرامج الأكاديمية (Majors & Programs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع التخصصات مع إمكانية التصفية بحسب الجامعة أو الدرجة
 * GET /api/majors?university_id=1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { university_id, category, degree_level } = req.query;

    if (isPostgresConnected) {
      let sql = `
        SELECT m.*, u.name_ar as university_name_ar, u.name_en as university_name_en,
               c.name_ar as country_name_ar, c.id as country_id
        FROM majors m
        LEFT JOIN universities u ON m.university_id = u.id
        LEFT JOIN countries c ON u.country_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (university_id) {
        params.push(university_id);
        sql += ` AND m.university_id = $${params.length}`;
      }
      if (category) {
        params.push(category);
        sql += ` AND m.category = $${params.length}`;
      }
      if (degree_level) {
        params.push(degree_level);
        sql += ` AND m.degree_level = $${params.length}`;
      }
      sql += ' ORDER BY m.id ASC';

      const result = await pool.query(sql, params);
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }

    let filtered = [...inMemoryStore.majors];
    if (university_id) {
      filtered = filtered.filter(m => m.university_id === parseInt(university_id as string, 10));
    }
    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }
    if (degree_level) {
      filtered = filtered.filter(m => m.degree_level === degree_level);
    }

    return res.json({ success: true, source: 'in-memory', data: filtered });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إضافة تخصص أكاديمي جديد
 * POST /api/majors
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { university_id, name_ar, name_en, category, degree_level, duration, annual_tuition } = req.body;

    if (!university_id || !name_ar || !name_en) {
      return res.status(400).json({ success: false, error: 'الجامعة والاسم بالعربية والإنجليزية حقول إلزامية' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO majors (university_id, name_ar, name_en, category, degree_level, duration, annual_tuition)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [university_id, name_ar, name_en, category || 'general', degree_level || 'bachelor', duration, annual_tuition]
      );
      return res.status(201).json({ success: true, message: 'تم إضافة التخصص بنجاح', data: result.rows[0] });
    }

    const newMajor = {
      id: Date.now(),
      university_id: parseInt(university_id, 10),
      name_ar,
      name_en,
      category: category || 'general',
      degree_level: degree_level || 'bachelor',
      duration,
      annual_tuition,
    };
    inMemoryStore.majors.push(newMajor);
    return res.status(201).json({ success: true, message: 'تم إضافة التخصص بنجاح', data: newMajor });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تعديل بيانات تخصص
 * PUT /api/majors/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { university_id, name_ar, name_en, category, degree_level, duration, annual_tuition } = req.body;

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE majors SET
           university_id = COALESCE($1, university_id),
           name_ar = COALESCE($2, name_ar),
           name_en = COALESCE($3, name_en),
           category = COALESCE($4, category),
           degree_level = COALESCE($5, degree_level),
           duration = COALESCE($6, duration),
           annual_tuition = COALESCE($7, annual_tuition)
         WHERE id = $8
         RETURNING *`,
        [university_id, name_ar, name_en, category, degree_level, duration, annual_tuition, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'التخصص غير موجود' });
      return res.json({ success: true, message: 'تم تعديل التخصص بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.majors.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'التخصص غير موجود' });
    inMemoryStore.majors[index] = { ...inMemoryStore.majors[index], ...req.body };
    return res.json({ success: true, message: 'تم تعديل التخصص بنجاح', data: inMemoryStore.majors[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * حذف تخصص
 * DELETE /api/majors/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isPostgresConnected) {
      await pool.query('DELETE FROM majors WHERE id = $1', [id]);
      return res.json({ success: true, message: 'تم حذف التخصص بنجاح' });
    }

    inMemoryStore.majors = inMemoryStore.majors.filter(m => m.id !== id);
    return res.json({ success: true, message: 'تم حذف التخصص بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
