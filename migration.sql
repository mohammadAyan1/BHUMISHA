-- Migration to add party_type and party_id to sales_orders table
-- Run this in your MySQL database

ALTER TABLE sales_orders
ADD COLUMN party_type ENUM('Customer', 'Vendor', 'Farmer') DEFAULT 'Customer' AFTER id,
ADD COLUMN party_id INT DEFAULT NULL AFTER party_type;

-- Update existing records to set party_type='Customer' and party_id=customer_id
UPDATE sales_orders SET party_type = 'Customer', party_id = customer_id WHERE customer_id IS NOT NULL;

-- Drop the old customer_id column and its constraints
ALTER TABLE sales_orders
DROP FOREIGN KEY fk_sales_orders_customer_id,
DROP INDEX idx_sales_orders_customer_id,
DROP COLUMN customer_id;
