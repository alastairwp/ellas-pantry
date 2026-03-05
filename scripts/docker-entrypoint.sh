#!/bin/sh
set -e

# Fix ownership of volume-mounted recipe images directory
chown -R nextjs:nodejs /app/public/images/recipes

echo "Running database migrations..."
su-exec nextjs node node_modules/prisma/build/index.js migrate deploy

echo "Starting application..."
exec su-exec nextjs node server.js
