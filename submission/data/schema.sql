-- Simplified schema showing key features (no sensitive data)
CREATE TABLE cust_info (
  id SERIAL PRIMARY KEY,
  col1 TEXT,        -- customer_name
  col2 TEXT,        -- email (contains some invalid entries)
  col3 TEXT,        -- signup_date (some invalid formats)
  col4 NUMERIC      -- total_purchases
);

CREATE TABLE ordrs ( -- intentionally misspelled
  order_id SERIAL PRIMARY KEY,
  cust_id INTEGER REFERENCES cust_info(id),
  order_date DATE,
  amount NUMERIC,
  status TEXT CHECK (status IN ('completed','pending','cancelled')),
  product_ids INTEGER[]  -- array of product IDs
);

CREATE TABLE prdcts ( -- intentionally abbreviated
  p_id SERIAL PRIMARY KEY,
  p_name TEXT,
  p_category TEXT,
  p_price NUMERIC,
  stock_qty INTEGER
);

CREATE TABLE metrics_daily (
  metric_date DATE PRIMARY KEY,
  metric_type TEXT,
  metric_value NUMERIC,
  notes TEXT
);

-- Sample data demonstrating complexity (5-10 rows per table)
INSERT INTO cust_info (col1, col2, col3, col4) VALUES
('John Doe', 'john@example.com', '2023-01-15', 1250.50),
('Jane Smith', 'jane@example.com', '2023-02-20', 850.75),
('Invalid Entry', 'bad-email', 'invalid-date', NULL); -- Dirty data example

INSERT INTO ordrs (cust_id, order_date, amount, status, product_ids) VALUES
(1, '2023-01-20', 250.50, 'completed', ARRAY[1,2]),
(2, '2023-02-15', 100.00, 'pending', ARRAY[3]);

INSERT INTO prdcts (p_name, p_category, p_price, stock_qty) VALUES
('Laptop', 'Electronics', 999.99, 50),
('Desk Chair', 'Furniture', 249.99, 30);

INSERT INTO metrics_daily VALUES
('2023-01-01', 'revenue', 1250.50, 'New year sale'),
('2023-02-01', 'new_customers', 5, NULL);