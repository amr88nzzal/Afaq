# Multi-stage build for Afaq Global Education platform
# ============================================================================
# ملاحظات أمنية وإصلاحات:
#   - أُزيل --sourcemap من أمر البناء في package.json، وكان dist/ يُخدَم
#     كاملاً فصار /server.cjs.map متاحاً للعامة ويكشف كود المصدر الكامل.
#   - أُزيل bun.lock لأن المشروع يُدار بـ npm وحده، وهذا يجعل npm ci ممكناً
#     (بناء حتمي) بدل npm install.
#   - الحاوية تعمل بمستخدم غير جذر.
#   - 🐞 إصلاح: كان هذا الملف ينسخ dist/ و server.ts فقط، بينما الخادم يقرأ
#     server/db/init.sql من القرص عند أول إقلاع. غيابه يعني أن قاعدة بيانات
#     جديدة تُنشأ **بلا جداول**. أُضيف نسخ مجلد SQL.
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for efficient caching
COPY package*.json ./
RUN npm ci

# Copy source files and build
COPY . .
RUN npm run build

# Production runtime container
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server bundle
COPY --from=builder /app/dist ./dist

# ملفات تأسيس قاعدة البيانات — يقرأها server/db.ts عند أول إقلاع
COPY --from=builder /app/server/db ./server/db

# مجلد بيانات التطبيق + تشغيل بمستخدم غير جذر
RUN mkdir -p /app/server/data/uploads/documents && chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "start"]
