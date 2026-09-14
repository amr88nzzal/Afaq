/**
 * ============================================================================
 * مسارات الجامعات والبرامج الأكاديمية (Universities & Academic Programs API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';
import { UNIVERSITIES_DATA } from '../../src/data/mockData';

const router = Router();

/**
 * جلب قائمة الجامعات مع إمكانية التصفية بحسب الدولة
 * GET /api/universities?country=uk
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { country } = req.query;

    if (isPostgresConnected) {
      let sql = 'SELECT * FROM universities';
      const params: any[] = [];
      if (country) {
        sql += ' WHERE country = $1';
        params.push(country);
      }
      sql += ' ORDER BY world_rank ASC';
      const result = await pool.query(sql, params);
      const sanitizedRows = result.rows.map(row => {
        let img = row.image;
        if (img && img.startsWith('/src/assets/images/')) {
          const fileName = img.split('/').pop();
          img = `/images/${fileName}`;
        }
        if (!img || img.includes('placeholder')) {
          img = row.country === 'uk' ? '/images/uk.jpg' : row.country === 'australia' ? '/images/australia.jpg' : '/images/new_zealand.jpg';
        }
        return { ...row, image: img };
      });
      return res.json({ success: true, source: 'postgres', data: sanitizedRows });
    }

    // الرد من الذاكرة
    let data = inMemoryStore.universities.length > 0 ? inMemoryStore.universities : UNIVERSITIES_DATA;
    if (country) {
      data = data.filter(u => u.country === country);
    }
    return res.json({ success: true, source: 'in-memory', data });
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
      const result = await pool.query('SELECT * FROM universities WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
      }
      return res.json({ success: true, data: result.rows[0] });
    }

    const univ = inMemoryStore.universities.find(u => u.id === id);
    if (!univ) {
      return res.status(404).json({ success: false, error: 'الجامعة غير موجودة' });
    }
    return res.json({ success: true, data: univ });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
