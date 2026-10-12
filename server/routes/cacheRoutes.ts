/**
 * ============================================================================
 * مسارات إدارة ومراقبة الذاكرة التشغيلية (Active Server Cache Monitoring API)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   كانت كل هذه المسارات مفتوحة للعامة، وأخطرها POST /clear و /invalidate
 *   التي تسمح لأي شخص بإسقاط الكاش (هجوم إسقاط خدمة بسيط) وبكشف إحصاءات
 *   داخلية. الآن كلها محصورة بالمدير.
 */

import { Router, Request, Response } from 'express';
import { cacheManager } from '../services/cacheManager';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * إحصائيات الذاكرة التشغيلية — للمدير فقط
 * GET /api/cache/stats
 */
router.get('/stats', requireAdmin, (_req: Request, res: Response) => {
  return res.json({
    success: true,
    status: 'active',
    stats: cacheManager.getStats(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * تفريغ الذاكرة المؤقتة بالكامل — للمدير فقط
 * POST /api/cache/clear
 */
router.post('/clear', requireAdmin, (_req: Request, res: Response) => {
  cacheManager.clearAll();
  return res.json({
    success: true,
    message: 'تم مسح وتفريغ الذاكرة التشغيلية المؤقتة بنجاح',
    timestamp: new Date().toISOString(),
  });
});

/**
 * إبطال مفتاح معين — للمدير فقط
 * POST /api/cache/invalidate
 */
router.post('/invalidate', requireAdmin, (req: Request, res: Response) => {
  const { key, prefix } = req.body || {};

  // حدّ لطول المفاتيح حتى لا تُستنزف الذاكرة بمفاتيح ضخمة من العميل
  const safeKey = typeof key === 'string' ? key.slice(0, 200) : undefined;
  const safePrefix = typeof prefix === 'string' ? prefix.slice(0, 200) : undefined;

  if (safeKey) cacheManager.invalidate(safeKey);
  if (safePrefix) cacheManager.invalidateByPrefix(safePrefix);

  return res.json({
    success: true,
    message: `تم إبطال الكاش للمفتاح/الرمز: ${safeKey || safePrefix || '(لا شيء)'}`,
    stats: cacheManager.getStats(),
  });
});

export default router;
