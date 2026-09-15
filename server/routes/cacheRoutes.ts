/**
 * ============================================================================
 * مسارات إدارة ومراقبة الذاكرة التشغيلية (Active Server Cache Monitoring API)
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { cacheManager } from '../services/cacheManager';

const router = Router();

/**
 * جلب إحصائيات وتدفق الذاكرة التشغيلية المؤقتة
 * GET /api/cache/stats
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = cacheManager.getStats();
  return res.json({
    success: true,
    cacheEngine: 'Afaq Active Server Cache Engine',
    status: 'active',
    stats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * تفريغ وإعادة تهيئة الذاكرة المؤقتة بالكامل
 * POST /api/cache/clear
 */
router.post('/clear', (req: Request, res: Response) => {
  cacheManager.clearAll();
  return res.json({
    success: true,
    message: 'تم مسح وتفريغ الذاكرة التشغيلية المؤقتة بنجاح (Cache Cleared)',
    timestamp: new Date().toISOString(),
  });
});

/**
 * إبطال مفتاح معين
 * POST /api/cache/invalidate
 */
router.post('/invalidate', (req: Request, res: Response) => {
  const { key, prefix } = req.body;
  if (key) {
    cacheManager.invalidate(key);
  }
  if (prefix) {
    cacheManager.invalidateByPrefix(prefix);
  }
  return res.json({
    success: true,
    message: `تم إبطال الكاش للمفتاح/الرمز: ${key || prefix}`,
    stats: cacheManager.getStats(),
  });
});

export default router;
