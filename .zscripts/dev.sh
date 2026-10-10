#!/bin/bash
# Studio dev bootstrap — executed by the platform /start.sh at container boot
# (as user z, in a background subshell, so `exec` at the end keeps it alive).
# Mirrors the default platform flow (install → db push → dev server) and adds:
#   - defensive seed when the template library is empty (fresh volume)
#   - mini-services startup (collab socket.io service on :3003)
set -e
cd /home/z/my-project
export NODE_ENV=development

echo "[dev.sh] bun install..."
bun install

echo "[dev.sh] prisma db push..."
bun run db:push

echo "[dev.sh] checking library size..."
TPL_COUNT=$(bun -e "const {db}=require('./src/lib/db'); db.template.count().then((c)=>{console.log(c);process.exit(0)}).catch(()=>{console.log(0);process.exit(0)})" 2>/dev/null | tail -1)
if [ "${TPL_COUNT:-0}" -eq 0 ]; then
  echo "[dev.sh] empty library — seeding templates/assets/accounts..."
  bun prisma/seed.ts || echo "[dev.sh] seed failed (continuing)"
else
  echo "[dev.sh] library already has $TPL_COUNT templates — skipping seed"
fi

# mini-services (each subdirectory with a package.json + dev script)
MINI_SERVICES_DIR="/home/z/my-project/mini-services"
if [ -d "$MINI_SERVICES_DIR" ]; then
  for service_dir in "$MINI_SERVICES_DIR"/*/; do
    [ -f "$service_dir/package.json" ] || continue
    service_name=$(basename "$service_dir")
    grep -q '"dev"' "$service_dir/package.json" || continue
    echo "[dev.sh] starting mini-service: $service_name"
    (
      cd "$service_dir"
      bun install >/dev/null 2>&1
      bun run dev
    ) > "/tmp/mini-service-${service_name}.log" 2>&1 &
  done
fi

echo "[dev.sh] starting next dev on :3000..."
exec bun run dev
