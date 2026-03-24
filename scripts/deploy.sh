#!/bin/bash
set -e
cd /var/www/ellas-pantry
npm ci
npx prisma generate
# Remove old standalone dir to avoid permission conflicts from symlinks
rm -rf .next/standalone
npm run build
# Standalone build needs static assets and public dir
cp -r .next/static .next/standalone/.next/static
rm -rf .next/standalone/public
ln -s /var/www/ellas-pantry/public .next/standalone/public
npx prisma migrate deploy
sudo systemctl restart ellas-pantry
