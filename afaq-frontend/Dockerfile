# ============================================================================
# حاوية بناء وتشغيل الواجهة الأمامية (Afaq Frontend Dockerfile)
# ============================================================================
# المرحلة 1: بناء ملفات React بواسطة Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# نسخ ملفات الحزم لتسريع الـ Caching
COPY package*.json ./
RUN npm install

# نسخ كود المصدر وبناء الحزم
COPY . .
RUN npm run build

# المرحلة 2: خادم Nginx عالي الأداء والسرعة
FROM nginx:alpine AS runner

# نسخ ملفات React المبنية إلى مسار Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ إعدادات Nginx المخصصة لدعم التوجيه ومسارات /api/
COPY ./afaq-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
