/**
 * ============================================================================
 * خادم الويب والتطبيق المدمج (Afaq Global Express + Vite Full-Stack Server)
 * ============================================================================
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { testDbConnection, isPostgresConnected } from './server/db';
import { cacheManager } from './server/services/cacheManager';
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

  // قراءة مدخلات الـ JSON والنماذج في الطلبات
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // فحص الاتصال بقاعدة بيانات PostgreSQL عند الإقلاع وتأسيس المخطط
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
      cacheEngineStats: cacheManager.getStats(),
      timestamp: new Date().toISOString(),
    });
  });

  // مسارات الجداول الأساسية والذاكرة المؤقتة
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

  // --------------------------------------------------------------------------
  // خدمة الملفات الثابتة والصور الرسمية والملفات المرفوعة (Public Static Assets & Images)
  // --------------------------------------------------------------------------
  const publicPath = path.join(process.cwd(), 'public');
  const rootUploadsPath = path.join(process.cwd(), 'uploads');
  const publicUploadsPath = path.join(publicPath, 'uploads');

  app.use(express.static(publicPath));
  app.use('/images', express.static(path.join(publicPath, 'images')));
  app.use('/uploads', express.static(publicUploadsPath));
  app.use('/uploads', express.static(rootUploadsPath));

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
