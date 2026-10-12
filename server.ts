/**
 * ============================================================================
 * خادم الويب والتطبيق المدمج (Afaq Global Express + Vite Full-Stack Server)
 * ============================================================================
 * ملاحظات أمنية على هذه النسخة:
 *   - رؤوس حماية على كل الاستجابات (securityHeaders).
 *   - مجلد الملفات المرفوعة لم يعد مخدوماً كملفات ثابتة، وأي طلب لـ /uploads
 *     يُرفض صراحةً — تُقدَّم المستندات فقط عبر مسار مُصرَّح يتحقق من الملكية.
 *   - نقطة /api/health لم تعد تكشف اسم الخدمة ولا الدومين ولا إحصاءات الكاش.
 *   - trust proxy مُفعَّل حتى يعمل تحديد المعدّل بشكل صحيح خلف nginx.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { testDbConnection, isPostgresConnected } from './server/db';
import { cacheManager } from './server/services/cacheManager';
import { securityHeaders } from './server/middleware/security';
import settingsRoutes from './server/routes/settingsRoutes';
import universitiesRoutes from './server/routes/universitiesRoutes';
import applicationsRoutes from './server/routes/applicationsRoutes';
import countriesRoutes from './server/routes/countriesRoutes';
import majorsRoutes from './server/routes/majorsRoutes';
import usersRoutes from './server/routes/usersRoutes';
import customersRoutes from './server/routes/customersRoutes';
import meetingsRoutes from './server/routes/meetingsRoutes';
import paragraphsRoutes from './server/routes/paragraphsRoutes';
import messagesRoutes from './server/routes/messagesRoutes';
import cacheRoutes from './server/routes/cacheRoutes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // سلسلة الوكلاء في بيئة النشر (Cloudflare Tunnel + Zero Trust):
  //   المتصفح → حافة Cloudflare → cloudflared → nginx → هذا الخادم
  // عدد القفزات الموثوقة يُضبط عبر TRUST_PROXY (افتراضياً 1 = nginx).
  //
  // ملاحظة مهمّة: تحديد المعدّل لا يعتمد على req.ip بل على ترويسة
  // CF-Connecting-IP التي تكتبها حافة Cloudflare وتستبدلها دائماً،
  // فلا يمكن للعميل تزويرها — بخلاف X-Forwarded-For.
  const trustProxyEnv = process.env.TRUST_PROXY;
  if (trustProxyEnv !== undefined && trustProxyEnv !== '') {
    const asNumber = Number(trustProxyEnv);
    const isNumeric = Number.isFinite(asNumber) && asNumber > 0;
    app.set('trust proxy', isNumeric ? asNumber : trustProxyEnv === 'true');
  } else {
    app.set('trust proxy', 1);
  }
  app.disable('x-powered-by');

  // رؤوس الحماية على كل الاستجابات
  app.use(securityHeaders);

  // قراءة مدخلات الـ JSON والنماذج في الطلبات
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // فحص الاتصال بقاعدة بيانات PostgreSQL عند الإقلاع وتأسيس المخطط
  await testDbConnection();

  // --------------------------------------------------------------------------
  // مسارات واجهة برمجة التطبيقات (RESTful API Routes)
  // الصلاحيات تُطبَّق داخل كل مسار حسب نوعه (عام / موظف / مدير)
  // --------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    // لا نكشف أي تفاصيل داخلية — فقط حالة عامة
    res.json({
      status: 'ok',
      postgresConnected: isPostgresConnected,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/settings', settingsRoutes);
  app.use('/api/countries', countriesRoutes);
  app.use('/api/universities', universitiesRoutes);
  app.use('/api/majors', majorsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/meetings', meetingsRoutes);
  app.use('/api/paragraphs', paragraphsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/cache', cacheRoutes);

  // ⛔ أي مسار /api غير معرّف يُعيد 404 بصيغة JSON.
  // بدونه كان الطلب يمرّ إلى معالج الواجهة (app.get('*')) فيُعاد index.html
  // بحالة 200 — وهذا يُضلّل العملاء (يظنون أن المسار موجود)، ويخفي أخطاء
  // كتابة المسارات، ويُعيد صفحة HTML لطلبات API.
  // ملاحظة: يجب أن يبقى قبل خدمة الملفات الثابتة والواجهة.
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'المسار المطلوب غير موجود' });
  });

  // --------------------------------------------------------------------------
  // خدمة الملفات الثابتة والصور الرسمية (Public Static Assets & Images)
  // --------------------------------------------------------------------------
  const publicPath = path.join(process.cwd(), 'public');

  // ⛔ منع الوصول المباشر لأي ملف مرفوع.
  // السبب: المستندات المرفوعة تحتوي جوازات سفر وكشوف درجات، وكانت مخدومة
  // كملفات ثابتة لأي زائر. التنزيل الآن يمرّ حصراً عبر
  // GET /api/applications/:id/documents/:docId/file بعد التحقق من الملكية.
  app.use(['/uploads', '/images/uploads', '/public/uploads'], (_req, res) => {
    res.status(404).json({ success: false, error: 'غير متاح' });
  });

  app.use(express.static(publicPath));
  app.use('/images', express.static(path.join(publicPath, 'images')));

  // --------------------------------------------------------------------------
  // خادم الواجهة الأمامية (Vite Middleware in Dev / Static Files in Prod)
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    // وضع التطوير المحلي والمعاينة الحية
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ [Vite] تم تفعيل بيئة التطوير التفاعلية السريعة');
  } else {
    // وضع الإنتاج (Production)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 [Static] يتم تقديم ملفات الإنتاج المجمعة من مجلد dist/');
  }

  // معالج أخطاء موحّد — لا يكشف تفاصيل داخلية للعميل
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ [Server] خطأ غير معالَج:', err?.message || err);
    if (res.headersSent) return;
    res.status(500).json({ success: false, error: 'حدث خطأ في الخادم، حاول لاحقاً' });
  });

  // الاستماع على المنفذ المعتمد وربط المضيف 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 خادم آفاق العالمية يعمل بنجاح على المنفذ: ${PORT}`);
    console.log(`🔌 واجهة الـ API: http://localhost:${PORT}/api/health`);
    console.log(`📊 عناصر الكاش النشطة: ${JSON.stringify(cacheManager.getStats())}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

startServer().catch(err => {
  console.error('❌ خطأ فادح أثناء تشغيل السيرفر:', err);
});
