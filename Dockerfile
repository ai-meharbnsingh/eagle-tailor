FROM node:20-alpine AS base
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# ── Build (frontend + backend bundle) ────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ── Production image ──────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p uploads/bills uploads/thumbnails && chown -R nodejs:nodejs uploads

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER nodejs

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/api/trpc/ping',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["npm", "start"]
