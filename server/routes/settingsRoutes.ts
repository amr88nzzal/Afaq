/**
 * ============================================================================
 * مسارات التحكم في إعدادات ومعطيات المنصة (Site Settings & Dynamic Content API)
 * ============================================================================
 * يسمح هذا المسار بقراءة وتعديل جميع أرقام الهواتف، الإيميلات، العناوين،
 * والنصوص العامة المخزنة في قاعدة البيانات (PostgreSQL) ليتم تعديلها
 * ديناميكياً من لوحة تحكم المشرف (Admin) أو برامج إدارة القواعد (pgAdmin).
 */

import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, inMemoryStore } from '../db';

const router = Router();

/**
 * جلب جميع الإعدادات الحالية للموقع
 * GET /api/settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query('SELECT key, value_ar, value_en, value_numeric, category FROM settings');
      const settingsObj: Record<string, any> = {};
      
      result.rows.forEach(row => {
        // Flatten into standard key-values and also provide structured values
        if (row.value_ar && row.value_en) {
          settingsObj[`${row.key}_ar`] = row.value_ar;
          settingsObj[`${row.key}_en`] = row.value_en;
        } else if (row.value_ar) {
          settingsObj[row.key] = row.value_ar;
          settingsObj[`${row.key}_ar`] = row.value_ar;
        } else if (row.value_en) {
          settingsObj[row.key] = row.value_en;
          settingsObj[`${row.key}_en`] = row.value_en;
        } else if (row.value_numeric !== null) {
          settingsObj[row.key] = row.value_numeric;
        }

        settingsObj[row.key] = settingsObj[row.key] || row.value_ar || row.value_en || '';
      });

      const merged = { ...inMemoryStore.settings, ...settingsObj };
      return res.json({ success: true, source: 'postgres', data: merged });
    }

    // الرد من الذاكرة في حال عدم تشغيل بوستجريس
    return res.json({ success: true, source: 'in-memory', data: inMemoryStore.settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error.message);
    return res.status(500).json({ success: false, error: error.message, data: inMemoryStore.settings });
  }
});

/**
 * تحديث الإعدادات (أرقام، بريد، عناوين، نصوص رئيسية)
 * PUT /api/settings
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'بيانات غير صالحة' });
    }

    // Update in-memory store
    inMemoryStore.settings = { ...inMemoryStore.settings, ...updates };

    // تحديث قاعدة بيانات PostgreSQL إذا كانت متصلة
    if (isPostgresConnected) {
      for (const [k, v] of Object.entries(updates)) {
        if (v && typeof v === 'object' && ('ar' in v || 'en' in v)) {
          const valObj = v as any;
          await pool.query(
            `INSERT INTO settings (key, value_ar, value_en, value_numeric, category) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (key) DO UPDATE SET 
               value_ar = EXCLUDED.value_ar, 
               value_en = EXCLUDED.value_en,
               value_numeric = EXCLUDED.value_numeric,
               category = EXCLUDED.category`,
            [k, valObj.ar || null, valObj.en || null, valObj.numeric || null, valObj.category || null]
          );
        } else {
          const valStr = typeof v === 'string' ? v : JSON.stringify(v);
          await pool.query(
            `INSERT INTO settings (key, value_ar, value_en, category) 
             VALUES ($1, $2, $3, 'general') 
             ON CONFLICT (key) DO UPDATE SET 
               value_ar = EXCLUDED.value_ar, 
               value_en = EXCLUDED.value_en`,
            [k, valStr, valStr]
          );
        }
      }
    }

    console.log('⚙️ [Settings Updated] تم تحديث إعدادات النظام بنجاح:', Object.keys(updates));
    return res.json({
      success: true,
      message: 'تم حفظ وتحديث الإعدادات بنجاح في قاعدة البيانات',
      data: inMemoryStore.settings
    });
  } catch (error: any) {
    console.error('Error updating settings:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
