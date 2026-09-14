/**
 * ============================================================================
 * خادم الويب والتطبيق المدمج (Afaq Global Express + Vite Full-Stack Server)
 * ============================================================================
 * هذا هو المدخل الرئيسي لخادم Node.js + Express:
 * 1. يوفر مسارات RESTful API على البادئة /api/
 * 2. يدمج Vite كـ Middleware في وضع التطوير لخدمة واجهة React فورياً.
 * 3. يخدم ملفات الإنتاج المجمعة (Production Dist) عند النشر.
 * 4. يربط قواعد البيانات ويشغل خدمات البريد وتلغرام بسلاسة.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { testDbConnection, isPostgresConnected } from './server/db';
import settingsRoutes from './server/routes/settingsRoutes';
import universitiesRoutes from './server/routes/universitiesRoutes';
import applicationsRoutes from './server/routes/applicationsRoutes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // قراءة مدخلات الـ JSON والنماذج في الطلبات
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // فحص الاتصال بقاعدة بيانات PostgreSQL عند الإقلاع
  await testDbConnection();

  // --------------------------------------------------------------------------
  // مسارات واجهة برمجة التطبيقات (RESTful API Routes)
  // --------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Afaq Global Education API',
      domain: 'afaq-global.amrodev.com',
      postgresConnected: isPostgresConnected,
      timestamp: new Date().toISOString(),
    });
  });

  // مسار إعدادات ومعطيات الموقع (هواتف، بريد، عناوين، نصوص)
  app.use('/api/settings', settingsRoutes);

  // مسار الجامعات والوجهات الأكاديمية
  app.use('/api/universities', universitiesRoutes);

  // مسار طلبات القبول والطلاب وبوابة المتابعة
  app.use('/api/applications', applicationsRoutes);

  // --------------------------------------------------------------------------
  // خدمة الملفات الثابتة والصور الرسمية (Public Static Assets & Images)
  // --------------------------------------------------------------------------
  const publicPath = path.join(process.cwd(), 'public');
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 [Static] يتم تقديم ملفات الإنتاج المجمعة من مجلد dist/');
  }

  // الاستماع على المنفذ المعتمد 3000 وربط المضيف 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 خادم آفاق العالمية يعمل بنجاح على المنفذ: ${PORT}`);
    console.log(`🌐 الدومين المعتمد: https://afaq-global.amrodev.com`);
    console.log(`🔌 واجهة الـ API: http://localhost:${PORT}/api/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

startServer().catch(err => {
  console.error('❌ خطأ فادح أثناء تشغيل السيرفر:', err);
});
