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
import { cacheManager } from '../services/cacheManager';

const router = Router();

/**
 * جلب جميع الإعدادات الحالية للموقع
 * GET /api/settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await cacheManager.getOrFetch(
      'settings',
      async () => {
        if (isPostgresConnected) {
          let rows: any[] = [];
          try {
            const queryRes = await pool.query('SELECT * FROM settings');
            rows = queryRes.rows;
          } catch {
            const queryRes2 = await pool.query('SELECT * FROM site_settings');
            rows = queryRes2.rows;
          }

          const settingsObj: Record<string, any> = {};
          rows.forEach(row => {
            const mainVal = row.value ?? row.value_ar ?? row.value_en ?? row.value_numeric;
            if (row.key) {
              settingsObj[row.key] = mainVal !== undefined && mainVal !== null ? String(mainVal) : '';

              if (row.value_ar) settingsObj[`${row.key}_ar`] = row.value_ar;
              if (row.value_en) settingsObj[`${row.key}_en`] = row.value_en;
            }
          });

          return { ...inMemoryStore.settings, ...settingsObj };
        }
        return { ...inMemoryStore.settings };
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
    console.error('Error fetching settings:', error.message);
    return res.status(200).json({ success: true, source: 'in-memory-fallback', data: inMemoryStore.settings });
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

    // إبطال وتحديث الذاكرة التشغيلية المؤقتة فوراً (Cache Invalidation)
    cacheManager.invalidate('settings');
    cacheManager.set('settings', inMemoryStore.settings, 15 * 60 * 1000);

    console.log('⚡ [Cache Invalidated & Updated] تم تحديث كاش إعدادات النظام فوراً:', Object.keys(updates));
    return res.json({
      success: true,
      message: 'تم حفظ وتحديث الإعدادات بنجاح في قاعدة البيانات وتجديد الذاكرة التشغيلية',
      data: inMemoryStore.settings
    });
  } catch (error: any) {
    console.error('Error updating settings:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
