-- Complete fix for missing companies table and company_id references
-- This script will:
-- 1. Create companies table if not exists
-- 2. Insert sample companies
-- 3. Update sales records with company_id
-- 4. Ensure foreign key references work

-- Step 1: Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text,
  `gst_no` varchar(50),
  `contact_no` varchar(20),
  `email` varchar(255),
  `owner_name` varchar(255),
  `image_url` varchar(255),
  `status` enum('Active', 'Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_companies_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Step 3: Insert companies (using INSERT IGNORE or ON DUPLICATE KEY to prevent errors)
INSERT INTO `companies` (`code`, `name`, `address`, `gst_no`, `contact_no`, `email`, `owner_name`, `status`)
VALUES 
  ('comp001', 'Default Company', '123 Business Street', '12ABCDE1234F1Z1', '9876543210', 'info@company1.com', 'Admin', 'Active'),
  ('comp002', 'Secondary Company', '456 Trade Avenue', '12BCDEF1234F1Z2', '9876543211', 'info@company2.com', 'Manager', 'Active')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- Step 4: Update all NULL or empty company_id in sales to 'comp001' (default)
UPDATE `sales` SET `company_id` = 'comp001' WHERE `company_id` IS NULL OR `company_id` = '' OR `company_id` = '0';

-- Step 5: Verify the updates
SELECT 'Companies created/updated:' as status, COUNT(*) as count FROM companies;
SELECT 'Sales records with company_id:' as status, COUNT(*) as count FROM sales WHERE company_id IS NOT NULL;
SELECT 'Sales records with company_id = comp001:' as status, COUNT(*) as count FROM sales WHERE company_id = 'comp001';

-- Step 6: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Optional: Show sample sales with all related data
-- SELECT s.id, s.bill_no, s.bill_date, s.total_amount, s.company_id, 
--        COUNT(si.id) as item_count
-- FROM sales s
-- LEFT JOIN sale_items si ON s.id = si.sale_id
-- GROUP BY s.id
-- LIMIT 5;
