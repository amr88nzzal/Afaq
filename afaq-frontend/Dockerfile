# ============================================================================
# حاوية بناء وتشغيل الواجهة الأمامية (Afaq Frontend Dockerfile)
# ============================================================================
# المرحلة 1: بناء ملفات React بواسطة Node.js (Debian Bookworm-slim)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# نسخ ملفات الحزم
COPY package*.json ./

# تثبيت الحزم مع فرض تثبيت حزم التوافق لمعالجات ARM64 (Rollup binary)
RUN npm install && npm install --save-optional @rollup/rollup-linux-arm64-gnu

# نسخ ملفات المشروع وبناء واجهة المستخدم عبر Vite
COPY . .
RUN npx vite build

# المرحلة 2: خادم Nginx عالي الأداء والسرعة لخدمة الملفات
FROM nginx:alpine AS runner

# نسخ ملفات React المبنية إلى مسار Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ إعدادات Nginx المخصصة لدعم التوجيه ومسارات /api/
COPY ./afaq-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
