#!/bin/bash

# Backup script for critical data
# Schedule with cron: 0 2 * * * /opt/ridebnb/backup.sh

BACKUP_DIR="/opt/backups/ridebnb"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📦 Starting backup: $DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "Backing up PostgreSQL..."
docker exec ridebnb-postgres pg_dump -U graph-node graph-node | gzip > \
    "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Backup IPFS data (optional, can be large)
# echo "Backing up IPFS..."
# docker exec ridebnb-ipfs tar czf - /data/ipfs > \
#     "$BACKUP_DIR/ipfs_$DATE.tar.gz"

# Backup environment and configs
echo "Backing up configurations..."
tar czf "$BACKUP_DIR/configs_$DATE.tar.gz" \
    /opt/ridebnb/docker/.env \
    /opt/ridebnb/nginx/nginx.conf \
    /opt/ridebnb/subgraph/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup complete: $BACKUP_DIR"
ls -lh $BACKUP_DIR | tail -5
