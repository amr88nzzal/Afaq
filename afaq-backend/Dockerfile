# ============================================================================
# حاوية بناء وتشغيل خادم الـ API (Afaq Backend Dockerfile)
# ============================================================================
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# نسخ ملف التعريف فقط وتثبيت الاعتماديات
COPY package.json ./
RUN npm install && npm install -g tsx

# نسخ ملفات الخادم وقواعد البيانات والخدمات
COPY server.ts ./
COPY server/ ./server/
COPY src/data/ ./src/data/
COPY src/types.ts ./src/types.ts

EXPOSE 5000

# تشغيل خادم Express عبر tsx
CMD ["tsx", "server.ts"]
