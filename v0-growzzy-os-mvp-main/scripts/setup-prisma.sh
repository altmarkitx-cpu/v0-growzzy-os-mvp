#!/bin/bash
set -e

echo "[v0] Installing dependencies..."
pnpm install

echo "[v0] Generating Prisma client..."
pnpm prisma generate

echo "[v0] Running database migrations..."
pnpm prisma db push --skip-generate

echo "[v0] Prisma setup complete!"
