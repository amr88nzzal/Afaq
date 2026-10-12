# ============================================================================
# حاوية بناء وتشغيل خادم الـ API (Afaq Backend Dockerfile)
# ============================================================================
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# نسخ ملف التعريف وتثبيت الاعتماديات
# ملاحظة: npm install بدل npm ci لأن هذا المشروع يحتوي ملفَي قفل متعارضين
# (package-lock.json و bun.lock). يُفضّل حذف bun.lock ثم استخدام npm ci.
COPY package.json ./
RUN npm install && npm install -g tsx

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

# تشغيل خادم Express عبر tsx
CMD ["tsx", "server.ts"]
