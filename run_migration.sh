#!/bin/bash
# Load environment variables
source .env 2>/dev/null || true

# Extract database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-vy_campaigns}"

# Run migration
echo "Running database migration..."
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" < migrations/2026-01-08-webhook-events-enhancement.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi
