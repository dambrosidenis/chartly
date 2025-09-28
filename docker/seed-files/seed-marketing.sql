-- =====================================================
-- MARKETING DOMAIN SEED DATA
-- =====================================================
-- Sample data for a marketing analytics platform
-- Tables: campaigns, leads, conversions, ad_spend, website_visits

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(100), -- 'google_ads', 'facebook', 'email', 'organic', 'direct'
    campaign_type VARCHAR(100), -- 'awareness', 'conversion', 'retargeting'
    start_date DATE NOT NULL,
    end_date DATE,
    budget DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active'
);

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    job_title VARCHAR(100),
    country_code CHAR(2),
    source_campaign_id BIGINT REFERENCES campaigns(id),
    lead_score INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'new' -- 'new', 'qualified', 'converted', 'lost'
);

-- =====================================================
-- CONVERSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversions (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT REFERENCES leads(id),
    campaign_id BIGINT REFERENCES campaigns(id),
    conversion_type VARCHAR(100), -- 'signup', 'purchase', 'demo_request', 'download'
    conversion_value DECIMAL(10,2),
    converted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- AD SPEND TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_spend (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT REFERENCES campaigns(id),
    spend_date DATE NOT NULL,
    amount_spent DECIMAL(10,2),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    channel VARCHAR(100)
);

-- =====================================================
-- WEBSITE VISITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS website_visits (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    visitor_country CHAR(2),
    source_campaign_id BIGINT REFERENCES campaigns(id),
    page_path VARCHAR(500),
    visit_duration INTEGER, -- seconds
    visited_at TIMESTAMP NOT NULL DEFAULT NOW(),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    converted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- SEED DATA GENERATION
-- =====================================================

-- Insert sample campaigns
INSERT INTO campaigns (name, channel, campaign_type, start_date, end_date, budget, status)
VALUES 
    ('Summer Sale 2024', 'google_ads', 'conversion', '2024-06-01', '2024-08-31', 15000.00, 'completed'),
    ('Brand Awareness Q3', 'facebook', 'awareness', '2024-07-01', '2024-09-30', 25000.00, 'active'),
    ('Email Newsletter', 'email', 'conversion', '2024-01-01', NULL, 5000.00, 'active'),
    ('Retargeting Campaign', 'google_ads', 'retargeting', '2024-08-15', '2024-11-15', 8000.00, 'active'),
    ('LinkedIn B2B', 'linkedin', 'awareness', '2024-05-01', '2024-07-31', 12000.00, 'completed'),
    ('Holiday Promotion', 'facebook', 'conversion', '2024-11-01', '2024-12-31', 20000.00, 'active'),
    ('Organic Content', 'organic', 'awareness', '2024-01-01', NULL, 0.00, 'active'),
    ('Direct Traffic', 'direct', 'conversion', '2024-01-01', NULL, 0.00, 'active'),
    ('YouTube Ads', 'youtube', 'awareness', '2024-09-01', '2024-12-31', 18000.00, 'active'),
    ('Influencer Partnership', 'influencer', 'awareness', '2024-10-01', '2024-10-31', 10000.00, 'active');

-- Insert sample leads (last 12 months)
INSERT INTO leads (email, first_name, last_name, company, job_title, country_code, source_campaign_id, lead_score, created_at, status)
SELECT 
    'lead' || generate_series || '@company' || (generate_series % 50 + 1) || '.com',
    CASE (generate_series % 12)
        WHEN 0 THEN 'Michael' WHEN 1 THEN 'Sarah' WHEN 2 THEN 'David' WHEN 3 THEN 'Jennifer'
        WHEN 4 THEN 'Robert' WHEN 5 THEN 'Lisa' WHEN 6 THEN 'William' WHEN 7 THEN 'Karen'
        WHEN 8 THEN 'James' WHEN 9 THEN 'Nancy' WHEN 10 THEN 'John' ELSE 'Betty'
    END,
    CASE (generate_series % 10)
        WHEN 0 THEN 'Johnson' WHEN 1 THEN 'Williams' WHEN 2 THEN 'Brown' WHEN 3 THEN 'Jones'
        WHEN 4 THEN 'Garcia' WHEN 5 THEN 'Miller' WHEN 6 THEN 'Davis' WHEN 7 THEN 'Rodriguez'
        WHEN 8 THEN 'Martinez' ELSE 'Hernandez'
    END,
    'Company ' || (generate_series % 100 + 1),
    CASE (generate_series % 8)
        WHEN 0 THEN 'Marketing Manager' WHEN 1 THEN 'Sales Director' WHEN 2 THEN 'CEO'
        WHEN 3 THEN 'VP Marketing' WHEN 4 THEN 'Product Manager' WHEN 5 THEN 'CMO'
        WHEN 6 THEN 'Business Development' ELSE 'Marketing Coordinator'
    END,
    CASE (generate_series % 8)
        WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'CA' WHEN 3 THEN 'DE'
        WHEN 4 THEN 'FR' WHEN 5 THEN 'AU' WHEN 6 THEN 'NL' ELSE 'SE'
    END,
    CASE WHEN random() < 0.8 THEN (random() * 9 + 1)::BIGINT ELSE NULL END,
    (random() * 100)::INTEGER,
    NOW() - (random() * INTERVAL '365 days'),
    CASE (random() * 10)::INTEGER
        WHEN 0 THEN 'new' WHEN 1 THEN 'qualified' WHEN 2 THEN 'converted' 
        WHEN 3 THEN 'lost' ELSE 'qualified'
    END
FROM generate_series(1, 5000);

-- Insert sample conversions
INSERT INTO conversions (lead_id, campaign_id, conversion_type, conversion_value, converted_at)
SELECT 
    l.id,
    l.source_campaign_id,
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'signup' WHEN 1 THEN 'purchase' 
        WHEN 2 THEN 'demo_request' ELSE 'download'
    END,
    CASE 
        WHEN (random() * 4)::INTEGER = 1 THEN (random() * 5000 + 100)::DECIMAL(10,2)
        ELSE (random() * 100)::DECIMAL(10,2)
    END,
    l.created_at + (random() * INTERVAL '30 days')
FROM leads l
WHERE l.status = 'converted' AND l.source_campaign_id IS NOT NULL
AND random() < 0.8;

-- Insert sample ad spend (daily data for last 6 months)
INSERT INTO ad_spend (campaign_id, spend_date, amount_spent, impressions, clicks, channel)
SELECT 
    c.id,
    generate_series::DATE,
    CASE 
        WHEN c.budget > 0 THEN (random() * (c.budget / 180) + 10)::DECIMAL(10,2)
        ELSE 0
    END,
    (random() * 10000 + 500)::INTEGER,
    (random() * 500 + 20)::INTEGER,
    c.channel
FROM campaigns c
CROSS JOIN generate_series(
    GREATEST(c.start_date, CURRENT_DATE - INTERVAL '180 days')::DATE,
    COALESCE(c.end_date, CURRENT_DATE)::DATE,
    '1 day'::INTERVAL
) AS generate_series
WHERE c.budget > 0;

-- Insert sample website visits (last 3 months)
INSERT INTO website_visits (session_id, visitor_country, source_campaign_id, page_path, visit_duration, visited_at, device_type, converted)
SELECT 
    'session_' || generate_series || '_' || (random() * 1000000)::BIGINT,
    CASE (random() * 8)::INTEGER
        WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'CA' WHEN 3 THEN 'DE'
        WHEN 4 THEN 'FR' WHEN 5 THEN 'AU' WHEN 6 THEN 'NL' ELSE 'SE'
    END,
    CASE WHEN random() < 0.6 THEN (random() * 9 + 1)::BIGINT ELSE NULL END,
    CASE (random() * 10)::INTEGER
        WHEN 0 THEN '/' WHEN 1 THEN '/products' WHEN 2 THEN '/about'
        WHEN 3 THEN '/contact' WHEN 4 THEN '/pricing' WHEN 5 THEN '/blog'
        WHEN 6 THEN '/demo' WHEN 7 THEN '/signup' WHEN 8 THEN '/login'
        ELSE '/features'
    END,
    (random() * 600 + 30)::INTEGER,
    NOW() - (random() * INTERVAL '90 days'),
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'desktop' WHEN 1 THEN 'mobile' ELSE 'tablet'
    END,
    random() < 0.05
FROM generate_series(1, 25000);

-- Update lead scores based on conversions
UPDATE leads 
SET lead_score = GREATEST(lead_score, conversion_scores.score)
FROM (
    SELECT lead_id, COUNT(*) * 20 + AVG(conversion_value)::INTEGER as score
    FROM conversions 
    GROUP BY lead_id
) conversion_scores
WHERE leads.id = conversion_scores.lead_id;
