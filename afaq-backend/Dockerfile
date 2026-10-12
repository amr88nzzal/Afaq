# ============================================================================
# حاوية بناء وتشغيل خادم الـ API (Afaq Backend Dockerfile)
# ============================================================================
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# نسخ ملفَي القفل والاعتماديات معاً — شرط استخدام npm ci.
# كان السابق ينسخ package.json فقط ويستخدم npm install (بناء غير حتمي)،
# وbun.lock كان موجوداً بجانب package-lock.json فيزيد الالتباس.
# تمت إزالة bun.lock لأن هذا المشروع يُدار بـ npm.
COPY package.json package-lock.json ./
RUN npm ci

# نسخ ملفات الخادم وقواعد البيانات والخدمات والوسطاء
COPY server.ts ./
COPY server/ ./server/
COPY src/data/ ./src/data/
COPY src/types.ts ./src/types.ts

# مجلد المستندات المرفوعة — خارج public/ فلا يمكن الوصول إليه كملف ثابت
RUN mkdir -p /app/server/data/uploads/documents && chown -R node:node /app

# ⛔ تشغيل الخادم بمستخدم غير جذر.
# كان الحاوية تعمل بـ root، فأي ثغرة في التطبيق تمنح المهاجم صلاحية root
# داخل الحاوية وتسهّل الهروب إلى المضيف.
# ملاحظة تشغيلية: إن ظهر خطأ EACCES عند رفع المستندات، فهذا يعني أن حجم
# التخزين (volume) مملوك لـ root. نفّذ مرة واحدة:
#   docker compose exec -u root afaq_backend chown -R node:node /app/server/data
USER node

EXPOSE 5000

# استخدام tsx المحلي من devDependencies بدل تثبيت عام بـ npm install -g
CMD ["npx", "tsx", "server.ts"]
