# ============================================================================
# حاوية بناء وتشغيل الواجهة الأمامية (Afaq Frontend Dockerfile)
# ============================================================================
# المرحلة 1: بناء ملفات React بواسطة Node.js على بيئة Debian
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# نسخ ملف التعريف مع ملف القفل — شرط استخدام npm ci.
#
# 🔧 إصلاح مهم: كان السابق ينسخ package.json وحده ويستخدم npm install،
#    ثم يثبّت **يدوياً** حزم ARM64 صراحةً:
#        npm install --no-save @rollup/rollup-linux-arm64-gnu lightningcss-linux-arm64-gnu
#    وهذا كان حلاً لمشكلة npm مع الاعتماديات الاختيارية (npm/cli#4828).
#    لكنه كان:
#      1. غير حتمي (npm install بلا ملف قفل)
#      2. خاصاً بمعمارية ARM64 — فأي سيرفر x64 (وهو الشائع سحابياً) يحصل
#         على الحزمة الخطأ، ويبقى معرّضاً لنفس الفشل.
#
#    أُصلح السبب الجذري بإعادة توليد package-lock.json بحيث يسجّل حزم كل
#    المعماريات (rollup: 15 → 52 مدخلاً لـ Linux، وlightningcss/oxide: 7 → 20).
#    تحقّقنا فعلياً على Linux: npm ci ثم npm run build يعملان بلا أي تثبيت يدوي.
COPY package.json package-lock.json ./
RUN npm ci

# نسخ كود المشروع وبناء الواجهة
COPY . .
RUN npx vite build

# المرحلة 2: خادم Nginx خفيف وعالي السرعة
FROM nginx:alpine AS runner

# ملاحظة أمنية متبقّية: صورة nginx الرسمية تشغّل العملية الرئيسية بـ root
# لأنها تربط المنفذ 80. للترقية إلى مستخدم غير جذر استبدل الصورة بـ
# nginxinc/nginx-unprivileged:alpine، وغيّر `listen 80` إلى `listen 8080`
# في afaq-frontend/nginx.conf، وEXPOSE 8080 هنا، ثم في docker-compose.yml
# اجعل الربط "127.0.0.1:3000:8080" وحدّث هدف النفق إلى
# http://afaq_frontend:8080. التغييرات الأربعة مترابطة — طبّقها معاً.

# نسخ ملفات الويب الجاهزة الناتجة عن البناء
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ الصور والشعار — كان هناك سطران متتاليان (public/images ثم public)
# والثاني يجعل الأول زائداً عن الحاجة، لذا أُبقي سطراً واحداً شاملاً.
COPY --from=builder /app/public /usr/share/nginx/html

# نسخ إعدادات Nginx المخصصة لدعم التوجيه ومسارات /api/
COPY ./afaq-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
