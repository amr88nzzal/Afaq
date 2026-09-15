/**
 * ============================================================================
 * مسارات الجامعات والبرامج الأكاديمية (Universities & Academic Programs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected } from '../db';

const router = Router();

/**
 * جلب قائمة الجامعات مع إمكانية التصفية بحسب الدولة
 * GET /api/universities?country_id=1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { country_id } = req.query;

    if (isPostgresConnected) {
      let sql = `
        SELECT u.*, c.name_ar as country_name_ar, c.name_en as country_name_en 
        FROM universities u
        LEFT JOIN countries c ON u.country_id = c.id
      `;
      const params: any[] = [];
      if (country_id) {
        sql += ' WHERE u.country_id = $1';
        params.push(country_id);
      }
      sql += ' ORDER BY u.ranking ASC';
      const result = await pool.query(sql, params);
      
      return res.json({ success: true, source: 'postgres', data: result.rows });
    }

    // المخزن المؤقت للذاكرة يحتاج لتحديث أيضاً، لكن سنركز على PostgreSQL الآن
    return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متصلة' });
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
    const { id } = req.params;

    if (isPostgresConnected) {
      const result = await pool.query(`
        SELECT u.*, c.name_ar as country_name_ar, c.name_en as country_name_en 
        FROM universities u
        LEFT JOIN countries c ON u.country_id = c.id
        WHERE u.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
      }
      return res.json({ success: true, data: result.rows[0] });
    }

    return res.status(503).json({ success: false, error: 'قاعدة البيانات غير متصلة' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
