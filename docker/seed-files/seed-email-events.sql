-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(50) DEFAULT 'free'
);

-- =====================================================
-- EVENTS TABLE (Central event tracking)
-- =====================================================
CREATE TABLE public.events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'email', 'notification', 'access', 'purchase'
    created_at TIMESTAMP DEFAULT NOW(),
    locale VARCHAR(10) DEFAULT 'en-US',
    device VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser_agent TEXT,
    ip_address INET,
    country_code VARCHAR(2)
);

-- =====================================================
-- EMAIL EVENTS TABLE
-- =====================================================
CREATE TABLE public.email_events (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL, -- 'welcome', 'marketing', 'transactional', 'newsletter'
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
    template_id VARCHAR(100),
    campaign_id VARCHAR(100)
);

-- =====================================================
-- NOTIFICATION EVENTS TABLE
-- =====================================================
CREATE TABLE public.notification_events (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'push', 'in_app', 'sms'
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'read', 'clicked', 'failed'
    channel VARCHAR(50), -- 'mobile_app', 'web_app', 'sms_gateway'
    priority VARCHAR(10) DEFAULT 'normal' -- 'low', 'normal', 'high', 'urgent'
);

-- =====================================================
-- ACCESS EVENTS TABLE
-- =====================================================
CREATE TABLE public.access_events (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL, -- 'signup', 'login', 'logout', 'password_reset'
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    session_id VARCHAR(255),
    two_factor_used BOOLEAN DEFAULT FALSE,
    login_method VARCHAR(50) -- 'email_password', 'google_oauth', 'github_oauth', 'magic_link'
);

-- =====================================================
-- PURCHASE EVENTS TABLE
-- =====================================================
CREATE TABLE public.purchase_events (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    amount_cents BIGINT NOT NULL, -- Store in cents to avoid floating point issues
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- 'credit_card', 'paypal', 'stripe', 'bank_transfer'
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded', 'cancelled'
    discount_code VARCHAR(100),
    discount_amount_cents BIGINT DEFAULT 0
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_created_at ON public.users (created_at);
CREATE INDEX idx_users_subscription_tier ON public.users (subscription_tier);

-- Events indexes
CREATE INDEX idx_events_user_id ON public.events (user_id);
CREATE INDEX idx_events_event_type ON public.events (event_type);
CREATE INDEX idx_events_created_at ON public.events (created_at);
CREATE INDEX idx_events_country_code ON public.events (country_code);
CREATE INDEX idx_events_device ON public.events (device);

-- Email events indexes
CREATE INDEX idx_email_events_event_id ON public.email_events (event_id);
CREATE INDEX idx_email_events_status ON public.email_events (status);
CREATE INDEX idx_email_events_email_type ON public.email_events (email_type);
CREATE INDEX idx_email_events_campaign_id ON public.email_events (campaign_id);

-- Notification events indexes
CREATE INDEX idx_notification_events_event_id ON public.notification_events (event_id);
CREATE INDEX idx_notification_events_status ON public.notification_events (status);
CREATE INDEX idx_notification_events_type ON public.notification_events (notification_type);

-- Access events indexes
CREATE INDEX idx_access_events_event_id ON public.access_events (event_id);
CREATE INDEX idx_access_events_type ON public.access_events (access_type);
CREATE INDEX idx_access_events_success ON public.access_events (success);

-- Purchase events indexes
CREATE INDEX idx_purchase_events_event_id ON public.purchase_events (event_id);
CREATE INDEX idx_purchase_events_product_id ON public.purchase_events (product_id);
CREATE INDEX idx_purchase_events_status ON public.purchase_events (status);
CREATE INDEX idx_purchase_events_amount ON public.purchase_events (amount_cents);

-- =====================================================
-- SAMPLE DATA GENERATION
-- =====================================================

-- Generate sample users (10,000 users)
INSERT INTO public.users (email, name, hashed_password, created_at, subscription_tier)
SELECT 
    'user' || generate_series || '@example.com',
    CASE 
        WHEN random() < 0.3 THEN 'John'
        WHEN random() < 0.5 THEN 'Jane'
        WHEN random() < 0.7 THEN 'Michael'
        WHEN random() < 0.8 THEN 'Sarah'
        WHEN random() < 0.9 THEN 'David'
        ELSE 'Emma'
    END || ' ' || 
    CASE 
        WHEN random() < 0.2 THEN 'Smith'
        WHEN random() < 0.4 THEN 'Johnson'
        WHEN random() < 0.6 THEN 'Williams'
        WHEN random() < 0.8 THEN 'Brown'
        ELSE 'Jones'
    END,
    '$2b$12$' || md5(random()::text), -- Simulated bcrypt hash
    NOW() - (random() * INTERVAL '365 days'),
    CASE 
        WHEN random() < 0.7 THEN 'free'
        WHEN random() < 0.9 THEN 'pro'
        ELSE 'enterprise'
    END
FROM generate_series(1, 10000);

-- Generate sample events and related data (50,000 events total)
WITH event_data AS (
    INSERT INTO public.events (user_id, event_type, created_at, locale, device, browser_agent, country_code)
    SELECT 
        (random() * 9999 + 1)::BIGINT, -- Random user_id between 1-10000
        CASE 
            WHEN random() < 0.4 THEN 'email'
            WHEN random() < 0.6 THEN 'access'
            WHEN random() < 0.8 THEN 'notification'
            ELSE 'purchase'
        END,
        NOW() - (random() * INTERVAL '90 days'),
        CASE 
            WHEN random() < 0.6 THEN 'en-US'
            WHEN random() < 0.8 THEN 'en-GB'
            WHEN random() < 0.9 THEN 'de-DE'
            ELSE 'fr-FR'
        END,
        CASE 
            WHEN random() < 0.5 THEN 'desktop'
            WHEN random() < 0.8 THEN 'mobile'
            ELSE 'tablet'
        END,
        CASE 
            WHEN random() < 0.4 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            WHEN random() < 0.7 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
            ELSE 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        END,
        CASE 
            WHEN random() < 0.3 THEN 'US'
            WHEN random() < 0.5 THEN 'GB'
            WHEN random() < 0.65 THEN 'DE'
            WHEN random() < 0.8 THEN 'FR'
            WHEN random() < 0.9 THEN 'CA'
            ELSE 'AU'
        END
    FROM generate_series(1, 50000)
    RETURNING id, event_type
)
-- Insert email events
INSERT INTO public.email_events (event_id, email_type, recipient_email, subject, status, template_id, campaign_id)
SELECT 
    id,
    CASE 
        WHEN random() < 0.3 THEN 'welcome'
        WHEN random() < 0.5 THEN 'marketing'
        WHEN random() < 0.8 THEN 'transactional'
        ELSE 'newsletter'
    END,
    'user' || (random() * 9999 + 1)::INT || '@example.com',
    CASE 
        WHEN random() < 0.3 THEN 'Welcome to our platform!'
        WHEN random() < 0.5 THEN 'Special offer just for you'
        WHEN random() < 0.7 THEN 'Your order confirmation'
        ELSE 'Weekly newsletter'
    END,
    CASE 
        WHEN random() < 0.7 THEN 'delivered'
        WHEN random() < 0.85 THEN 'opened'
        WHEN random() < 0.92 THEN 'clicked'
        WHEN random() < 0.97 THEN 'bounced'
        ELSE 'complained'
    END,
    'template_' || (random() * 50 + 1)::INT,
    CASE WHEN random() < 0.7 THEN 'campaign_' || (random() * 20 + 1)::INT ELSE NULL END
FROM event_data 
WHERE event_type = 'email';

-- Insert notification events
WITH notification_events_data AS (
    SELECT id FROM public.events WHERE event_type = 'notification'
)
INSERT INTO public.notification_events (event_id, notification_type, title, message, status, channel, priority)
SELECT 
    id,
    CASE 
        WHEN random() < 0.5 THEN 'push'
        WHEN random() < 0.8 THEN 'in_app'
        ELSE 'sms'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'New message received'
        WHEN random() < 0.6 THEN 'Your order is ready'
        ELSE 'Don''t forget to check your dashboard'
    END,
    'This is a sample notification message with some details about the event.',
    CASE 
        WHEN random() < 0.8 THEN 'delivered'
        WHEN random() < 0.9 THEN 'read'
        WHEN random() < 0.95 THEN 'clicked'
        ELSE 'failed'
    END,
    CASE 
        WHEN random() < 0.4 THEN 'mobile_app'
        WHEN random() < 0.8 THEN 'web_app'
        ELSE 'sms_gateway'
    END,
    CASE 
        WHEN random() < 0.1 THEN 'urgent'
        WHEN random() < 0.3 THEN 'high'
        WHEN random() < 0.9 THEN 'normal'
        ELSE 'low'
    END
FROM notification_events_data;

-- Insert access events
WITH access_events_data AS (
    SELECT id FROM public.events WHERE event_type = 'access'
)
INSERT INTO public.access_events (event_id, access_type, success, failure_reason, session_id, two_factor_used, login_method)
SELECT 
    id,
    CASE 
        WHEN random() < 0.2 THEN 'signup'
        WHEN random() < 0.7 THEN 'login'
        WHEN random() < 0.9 THEN 'logout'
        ELSE 'password_reset'
    END,
    random() < 0.85, -- 85% success rate
    CASE 
        WHEN random() < 0.85 THEN NULL
        WHEN random() < 0.9 THEN 'Invalid credentials'
        WHEN random() < 0.95 THEN 'Account locked'
        ELSE 'Two-factor authentication failed'
    END,
    'sess_' || md5(random()::text),
    random() < 0.3, -- 30% use 2FA
    CASE 
        WHEN random() < 0.7 THEN 'email_password'
        WHEN random() < 0.85 THEN 'google_oauth'
        WHEN random() < 0.95 THEN 'github_oauth'
        ELSE 'magic_link'
    END
FROM access_events_data;

-- Insert purchase events
WITH purchase_events_data AS (
    SELECT id FROM public.events WHERE event_type = 'purchase'
)
INSERT INTO public.purchase_events (event_id, product_id, product_name, amount_cents, currency, payment_method, transaction_id, status, discount_code, discount_amount_cents)
SELECT 
    id,
    'prod_' || (random() * 100 + 1)::INT,
    CASE 
        WHEN random() < 0.3 THEN 'Pro Subscription'
        WHEN random() < 0.5 THEN 'Enterprise License'
        WHEN random() < 0.7 THEN 'Premium Features'
        WHEN random() < 0.85 THEN 'Additional Storage'
        ELSE 'Custom Integration'
    END,
    (random() * 50000 + 999)::BIGINT, -- $9.99 to $509.99
    CASE 
        WHEN random() < 0.8 THEN 'USD'
        WHEN random() < 0.9 THEN 'EUR'
        ELSE 'GBP'
    END,
    CASE 
        WHEN random() < 0.6 THEN 'credit_card'
        WHEN random() < 0.8 THEN 'paypal'
        WHEN random() < 0.95 THEN 'stripe'
        ELSE 'bank_transfer'
    END,
    'txn_' || md5(random()::text),
    CASE 
        WHEN random() < 0.85 THEN 'completed'
        WHEN random() < 0.92 THEN 'pending'
        WHEN random() < 0.97 THEN 'failed'
        ELSE 'refunded'
    END,
    CASE WHEN random() < 0.2 THEN 'SAVE20' ELSE NULL END,
    CASE WHEN random() < 0.2 THEN (random() * 5000)::BIGINT ELSE 0 END
FROM purchase_events_data;