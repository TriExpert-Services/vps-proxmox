#!/bin/sh
# Database backup script for Docker container

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="postgres"
DB_NAME="${DB_NAME:-cloudvps}"
DB_USER="${DB_USERNAME:-cloudvps}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "Starting database backup at $(date)"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/cloudvps_db_$DATE.sql.gz"

if [ $? -eq 0 ]; then
    echo "Database backup completed successfully: cloudvps_db_$DATE.sql.gz"
else
    echo "Database backup failed!"
    exit 1
fi

# Keep only last 30 days of backups
find $BACKUP_DIR -name "cloudvps_db_*.sql.gz" -mtime +30 -delete

# Clean up old backups (keep last 10 files)
ls -t $BACKUP_DIR/cloudvps_db_*.sql.gz | tail -n +11 | xargs -r rm

echo "Backup process completed at $(date)"