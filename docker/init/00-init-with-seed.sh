#!/bin/bash
set -e

# Initialize database with user and permissions
echo "Initializing database with user and permissions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create read-only user for analytics
    CREATE USER analytics_ro WITH PASSWORD 'readonly_password';
    
    -- Grant connection to the database
    GRANT CONNECT ON DATABASE analytics TO analytics_ro;
    
    -- Grant usage on public schema
    GRANT USAGE ON SCHEMA public TO analytics_ro;
    
    -- Grant select on all existing tables in public schema
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_ro;
    
    -- Grant select on all future tables in public schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_ro;
EOSQL

# Load seed data file if specified
SEED_FILE=${SEED_FILE:-seed-email-events.sql}
SEED_SOURCE="/seed-files/$SEED_FILE"

if [ -f "$SEED_SOURCE" ]; then
    echo "Loading seed data from $SEED_FILE..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SEED_SOURCE"
    echo "Seed data loaded successfully from $SEED_FILE"
else
    echo "Warning: Seed file $SEED_FILE not found at $SEED_SOURCE"
    echo "Available seed files:"
    ls -la /seed-files/seed-*.sql 2>/dev/null || echo "No seed files found"
fi

echo "Database initialization complete!"
