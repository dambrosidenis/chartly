-- =====================================================
-- E-COMMERCE DOMAIN SEED DATA
-- =====================================================
-- Sample data for an e-commerce analytics platform
-- Tables: customers, products, orders, order_items, reviews

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    country_code CHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    total_spent DECIMAL(10,2) DEFAULT 0
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    shipping_country CHAR(2)
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    product_id BIGINT REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    product_id BIGINT REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- SEED DATA GENERATION
-- =====================================================

-- Insert sample customers
INSERT INTO customers (email, first_name, last_name, country_code, city, created_at, last_login_at, total_spent)
SELECT 
    'customer' || generate_series || '@example.com',
    CASE (generate_series % 10)
        WHEN 0 THEN 'John' WHEN 1 THEN 'Jane' WHEN 2 THEN 'Mike' WHEN 3 THEN 'Sarah'
        WHEN 4 THEN 'David' WHEN 5 THEN 'Lisa' WHEN 6 THEN 'Chris' WHEN 7 THEN 'Emma'
        WHEN 8 THEN 'Alex' ELSE 'Jordan'
    END,
    CASE (generate_series % 8)
        WHEN 0 THEN 'Smith' WHEN 1 THEN 'Johnson' WHEN 2 THEN 'Williams' WHEN 3 THEN 'Brown'
        WHEN 4 THEN 'Jones' WHEN 5 THEN 'Garcia' WHEN 6 THEN 'Miller' ELSE 'Davis'
    END,
    CASE (generate_series % 6)
        WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'CA' 
        WHEN 3 THEN 'DE' WHEN 4 THEN 'FR' ELSE 'AU'
    END,
    CASE (generate_series % 12)
        WHEN 0 THEN 'New York' WHEN 1 THEN 'London' WHEN 2 THEN 'Toronto'
        WHEN 3 THEN 'Berlin' WHEN 4 THEN 'Paris' WHEN 5 THEN 'Sydney'
        WHEN 6 THEN 'Los Angeles' WHEN 7 THEN 'Manchester' WHEN 8 THEN 'Vancouver'
        WHEN 9 THEN 'Munich' WHEN 10 THEN 'Lyon' ELSE 'Melbourne'
    END,
    NOW() - (random() * INTERVAL '365 days'),
    NOW() - (random() * INTERVAL '30 days'),
    (random() * 5000)::DECIMAL(10,2)
FROM generate_series(1, 1000);

-- Insert sample products
INSERT INTO products (name, category, price, cost, stock_quantity, created_at)
VALUES 
    ('Wireless Headphones', 'Electronics', 99.99, 45.00, 150, NOW()),
    ('Running Shoes', 'Footwear', 129.99, 65.00, 200, NOW()),
    ('Coffee Maker', 'Appliances', 79.99, 35.00, 75, NOW()),
    ('Laptop Backpack', 'Accessories', 49.99, 20.00, 300, NOW()),
    ('Smartphone Case', 'Electronics', 24.99, 8.00, 500, NOW()),
    ('Yoga Mat', 'Fitness', 39.99, 15.00, 100, NOW()),
    ('Desk Lamp', 'Home', 34.99, 12.00, 80, NOW()),
    ('Water Bottle', 'Accessories', 19.99, 7.00, 400, NOW()),
    ('Bluetooth Speaker', 'Electronics', 69.99, 30.00, 120, NOW()),
    ('Notebook Set', 'Stationery', 14.99, 5.00, 250, NOW()),
    ('Gaming Mouse', 'Electronics', 59.99, 25.00, 90, NOW()),
    ('Hoodie', 'Clothing', 44.99, 18.00, 180, NOW()),
    ('Protein Powder', 'Health', 89.99, 40.00, 60, NOW()),
    ('Phone Charger', 'Electronics', 29.99, 10.00, 350, NOW()),
    ('Sunglasses', 'Accessories', 79.99, 30.00, 140, NOW());

-- Insert sample orders (last 6 months)
INSERT INTO orders (customer_id, order_date, status, total_amount, shipping_cost, discount_amount, payment_method, shipping_country)
SELECT 
    (random() * 999 + 1)::BIGINT,
    NOW() - (random() * INTERVAL '180 days'),
    CASE (random() * 10)::INTEGER
        WHEN 0 THEN 'pending' WHEN 1 THEN 'processing' WHEN 2 THEN 'shipped'
        WHEN 3 THEN 'delivered' WHEN 4 THEN 'cancelled' ELSE 'delivered'
    END,
    (random() * 500 + 20)::DECIMAL(10,2),
    (random() * 15 + 5)::DECIMAL(10,2),
    CASE WHEN random() < 0.3 THEN (random() * 50)::DECIMAL(10,2) ELSE 0 END,
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'credit_card' WHEN 1 THEN 'paypal' 
        WHEN 2 THEN 'debit_card' ELSE 'apple_pay'
    END,
    CASE (random() * 6)::INTEGER
        WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'CA'
        WHEN 3 THEN 'DE' WHEN 4 THEN 'FR' ELSE 'AU'
    END
FROM generate_series(1, 2500);

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    (random() * 14 + 1)::BIGINT,
    (random() * 3 + 1)::INTEGER,
    p.price,
    p.price * (random() * 3 + 1)::INTEGER
FROM orders o
CROSS JOIN LATERAL (
    SELECT price FROM products WHERE id = (random() * 14 + 1)::BIGINT LIMIT 1
) p
WHERE random() < 0.8; -- Not every order gets items (simulates some data inconsistencies)

-- Insert sample reviews
INSERT INTO reviews (customer_id, product_id, rating, review_text, created_at, is_verified)
SELECT 
    (random() * 999 + 1)::BIGINT,
    (random() * 14 + 1)::BIGINT,
    FLOOR(random() * 5)::INTEGER + 1,
    CASE (random() * 8)::INTEGER
        WHEN 0 THEN 'Great product, highly recommend!'
        WHEN 1 THEN 'Good value for money.'
        WHEN 2 THEN 'Fast shipping, product as described.'
        WHEN 3 THEN 'Could be better, but okay for the price.'
        WHEN 4 THEN 'Excellent quality and service.'
        WHEN 5 THEN 'Not what I expected, disappointed.'
        WHEN 6 THEN 'Perfect! Will buy again.'
        ELSE 'Average product, nothing special.'
    END,
    NOW() - (random() * INTERVAL '120 days'),
    random() < 0.7
FROM generate_series(1, 800);

-- Update customer total_spent based on their orders
UPDATE customers 
SET total_spent = COALESCE(order_totals.total, 0)
FROM (
    SELECT customer_id, SUM(total_amount) as total
    FROM orders 
    WHERE status = 'delivered'
    GROUP BY customer_id
) order_totals
WHERE customers.id = order_totals.customer_id;
