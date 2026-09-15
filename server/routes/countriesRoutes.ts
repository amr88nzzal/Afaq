/**
 * ============================================================================
 * مسارات إدارة الدول والوجهات الدراسية (Countries API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع الدول والوجهات الدراسية
 * GET /api/countries
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query('SELECT * FROM countries ORDER BY id ASC');
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.countries });
  } catch (error: any) {
    console.error('Error fetching countries:', error.message);
    return res.status(500).json({ success: false, error: error.message, data: inMemoryStore.countries });
  }
});

/**
 * إضافة دولة دراسية جديدة
 * POST /api/countries
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, name_ar, name_en, info_ar, info_en, image_url, is_active } = req.body;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, error: 'الاسم بالعربية والإنجليزية مطلوب' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO countries (code, name_ar, name_en, info_ar, info_en, image_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [code || name_en.toLowerCase().replace(/\s+/g, '-'), name_ar, name_en, info_ar, info_en, image_url, is_active ?? true]
      );
      return res.status(201).json({ success: true, message: 'تم إضافة الدولة بنجاح', data: result.rows[0] });
    }

    const newCountry = {
      id: Date.now(),
      code: code || name_en.toLowerCase().replace(/\s+/g, '-'),
      name_ar,
      name_en,
      info_ar,
      info_en,
      image_url,
      is_active: is_active ?? true,
    };
    inMemoryStore.countries.push(newCountry);
    return res.status(201).json({ success: true, message: 'تم إضافة الدولة بنجاح', data: newCountry });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تعديل بيانات دولة
 * PUT /api/countries/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { code, name_ar, name_en, info_ar, info_en, image_url, is_active } = req.body;

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
      return res.json({ success: true, message: 'تم تعديل الدولة بنجاح', data: result.rows[0] });
    }

    const index = inMemoryStore.countries.findIndex(c => Number(c.id) === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'الدولة غير موجودة' });
    inMemoryStore.countries[index] = { ...inMemoryStore.countries[index], ...req.body };
    return res.json({ success: true, message: 'تم تعديل الدولة بنجاح', data: inMemoryStore.countries[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * حذف دولة
 * DELETE /api/countries/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isPostgresConnected) {
      // Disassociate any universities or applications referencing this country first if needed
      await pool.query('UPDATE universities SET country_id = NULL WHERE country_id = $1', [id]);
      await pool.query('UPDATE applications SET country_id = NULL WHERE country_id = $1', [id]);
      const result = await pool.query('DELETE FROM countries WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'الدولة غير موجودة في قاعدة البيانات' });
      }
      return res.json({ success: true, message: 'تم حذف الدولة بنجاح' });
    }

    const prevLen = inMemoryStore.countries.length;
    inMemoryStore.countries = inMemoryStore.countries.filter(c => Number(c.id) !== id);
    if (inMemoryStore.countries.length === prevLen) {
      return res.status(404).json({ success: false, error: 'الدولة غير موجودة' });
    }
    return res.json({ success: true, message: 'تم حذف الدولة بنجاح' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
