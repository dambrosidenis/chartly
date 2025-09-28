# Docker Database Setup

This directory contains the Docker configuration for the PostgreSQL database with different seed data domains.

## Quick Start

### Default (Email Events)
```bash
docker-compose up -d
```

### E-commerce Domain
```bash
SEED_FILE=seed-ecommerce.sql docker-compose up -d
```

### Marketing Domain
```bash
SEED_FILE=seed-marketing.sql docker-compose up -d
```

## Available Seed Domains

### 📧 `seed-email-events.sql` (Default)
**Domain:** Email Marketing Analytics
- **Tables:** `email_events`
- **Sample Data:** 10,000+ email events across multiple countries and statuses
- **Use Cases:** Email campaign performance, delivery tracking, bounce analysis
- **Example Questions:**
  - "Daily email count"
  - "Top countries by email volume" 
  - "Bounce rates by country"

### 🛒 `seed-ecommerce.sql`
**Domain:** E-commerce Analytics
- **Tables:** `customers`, `products`, `orders`, `order_items`, `reviews`
- **Sample Data:** 1,000 customers, 15 products, 2,500+ orders, 800+ reviews
- **Use Cases:** Sales analysis, customer behavior, product performance
- **Example Questions:**
  - "Top 5 countries by total amount?"
  - "Monthly orders over last year?"
  - "Average rating by product category?"
  - "Payment method vs shipping cost?"

### 📈 `seed-marketing.sql`
**Domain:** Marketing Analytics
- **Tables:** `campaigns`, `leads`, `conversions`, `ad_spend`, `website_visits`
- **Sample Data:** 10 campaigns, 5,000 leads, 25,000+ website visits, daily ad spend
- **Use Cases:** Campaign ROI, lead generation, conversion tracking
- **Example Questions:**
  - "Campaign ROI by channel"
  - "Lead conversion rates"
  - "Website traffic sources"
  - "Cost per acquisition trends"

## Directory Structure

```
docker/
├── README.md                   # This file - main documentation
├── init/
│   └── 00-init-with-seed.sh    # Database initialization script
└── seed-files/
    ├── seed-email-events.sql   # Email marketing seed data (default)
    ├── seed-ecommerce.sql      # E-commerce seed data
    └── seed-marketing.sql      # Marketing analytics seed data
```

## Creating Custom Domains

1. **Create a new seed file** in `seed-files/` following the naming pattern: `seed-{domain}.sql`
2. **Include table creation** with `CREATE TABLE IF NOT EXISTS`
3. **Generate realistic sample data** using PostgreSQL functions like `generate_series()`, `random()`, etc.
4. **Test your seed file** by setting `SEED_FILE=your-seed-file.sql`

### Template Structure
```sql
-- =====================================================
-- YOUR DOMAIN NAME SEED DATA
-- =====================================================

-- Create tables
CREATE TABLE IF NOT EXISTS your_table (
    id BIGSERIAL PRIMARY KEY,
    -- your columns here
);

-- Insert sample data
INSERT INTO your_table (columns...)
SELECT 
    -- generate realistic data using PostgreSQL functions
FROM generate_series(1, 1000);
```

## Technical Notes

- The initialization script (`00-init-with-seed.sh`) handles user creation and permissions
- All seed files automatically get SELECT permissions for the `analytics_ro` user
- Use `CREATE TABLE IF NOT EXISTS` to avoid conflicts
- The schema investigation will automatically analyze your tables and generate relevant example questions
- Seed files are loaded only once during database initialization
- To switch domains, stop the database (`docker-compose down`) and restart with a different `SEED_FILE`
- If a specified seed file doesn't exist, the initialization will show available options

## Database Users

- **postgres**: Admin user (full access)
- **analytics_ro**: Read-only user for analytics queries (password: `readonly_password`)
