# ============================================================================
# حاوية بناء وتشغيل الواجهة الأمامية (Afaq Frontend Dockerfile)
# ============================================================================
# المرحلة 1: بناء ملفات React بواسطة Node.js على بيئة Debian
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# نسخ ملف التعريف فقط لتجنب قيود أي lockfile قديم
COPY package.json ./

# تثبيت الحزم الأساسية بالإضافة لمكتبات التوافق الصريحة لمعمارية ARM64 (Rollup + LightningCSS)
RUN npm install --include=optional && \
    npm install --no-save @rollup/rollup-linux-arm64-gnu lightningcss-linux-arm64-gnu

# نسخ كود المشروع وبناء الواجهة
COPY . .
RUN npx vite build

# المرحلة 2: خادم Nginx خفيف وعالي السرعة
FROM nginx:alpine AS runner

# نسخ ملفات الويب الجاهزة
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ إعدادات Nginx المخصصة لدعم التوجيه ومسارات /api/
COPY ./afaq-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
