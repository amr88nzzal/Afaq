# Multi-stage build for Afaq Global Education platform
# ============================================================================
# ملاحظة أمنية: أُضيف --sourcemap سابقاً إلى أمر البناء في package.json، وكان
# dist/ يُخدَم كاملاً، فصار /server.cjs.map متاحاً للعامة ويكشف كود المصدر
# الكامل للخادم. تمت إزالة --sourcemap من أمر البناء.
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

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

# مجلد بيانات التطبيق + تشغيل بمستخدم غير جذر
RUN mkdir -p /app/server/data/uploads/documents && chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "start"]
