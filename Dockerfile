# --- deps ---
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- app ---
FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/db/custom.db
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:push || true
EXPOSE 3000 3003
CMD ["sh", "-c", "bun prisma/seed.ts || true; bun run dev"]
