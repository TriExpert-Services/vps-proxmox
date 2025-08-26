#!/bin/sh
set -e

echo "Starting CloudVPS Pro application..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "Redis is ready!"

# Run database migrations if needed
if [ "$NODE_ENV" = "production" ]; then
  echo "Running database migrations..."
  npm run db:migrate:production || echo "Migration failed or not available"
fi

# Create uploads directory
mkdir -p /app/uploads
mkdir -p /app/logs

# Set proper permissions
chown -R $(id -u):$(id -g) /app/uploads /app/logs

echo "Starting application..."
exec "$@"