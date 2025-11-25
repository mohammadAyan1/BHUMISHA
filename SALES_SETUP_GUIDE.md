# Sales Reports Setup - Complete Guide

## Root Cause Analysis

Your sales data wasn't showing because:

1. ❌ **Missing `companies` table** - The database doesn't have the companies table that stores company codes
2. ❌ **Sales records have NULL `company_id`** - The sales data was inserted without company_id values
3. ❌ **Frontend sends company codes** - The frontend sends company codes but backend query finds no matches

## Solution

### Step 1: Run Database Migration

Run this SQL script in your MySQL client (PHPMyAdmin, MySQL Workbench, or command line):

**File**: `setup_sales_data.sql`

```bash
# If using MySQL CLI:
mysql -u root -p bhumisha < setup_sales_data.sql

# Or in PHPMyAdmin: 
# 1. Go to Import
# 2. Select setup_sales_data.sql
# 3. Click Go
```

This script will:
- ✅ Create the `companies` table
- ✅ Insert 2 sample companies (`comp001`, `comp002`)
- ✅ Update all sales records with `company_id = 'comp001'`

### Step 2: Restart Backend Server

```bash
cd Backend
npm start
```

You should see these logs:
```
📋 Received companies: [{"id":1,"code":"comp001",...}, {"id":2,"code":"comp002",...}]
🔍 Fetching sales for company code: comp001
📊 Query result for company comp001: 14 rows  # Should show number > 0
```

### Step 3: Refresh Frontend

- Open Dashboard - should show:
  - ✅ Total Sales Amount (e.g., ₹1,234.56)
  - ✅ Sales Invoices count (e.g., 14)
  - ✅ Dynamic line chart with monthly revenue
  - ✅ Dynamic bar chart with vendor registrations  
  - ✅ Pie chart showing sales by party type

- Open Sales Reports - should show:
  - ✅ Table with bills (bill_no, date, products, customer, category, amount)
  - ✅ All filters working (company, party type, date range, search)
  - ✅ Modal with detailed bill information

## Verification

### To verify companies are created:
```sql
SELECT * FROM companies;
```
Expected output:
```
id | code    | name                | status
1  | comp001 | Default Company     | Active
2  | comp002 | Secondary Company   | Active
```

### To verify sales have company_id:
```sql
SELECT COUNT(*) as total, 
       COUNT(DISTINCT company_id) as companies,
       company_id
FROM sales
GROUP BY company_id;
```
Expected output:
```
total | companies | company_id
14    | 1         | comp001
```

### To verify sales with items:
```sql
SELECT s.id, s.bill_no, s.total_amount, COUNT(si.id) as items
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.company_id = 'comp001'
GROUP BY s.id
LIMIT 5;
```

## Console Logs - What to Look For

### Backend (Node console):
```
✅ Dashboard: Total companies to fetch: 2
🔄 Fetching all purchases for companies...
🔍 Fetching sales for company code: comp001
📊 Query result for company comp001: 14 rows
✅ Sales metrics: { invoiceCount: 14, totalProfit: 1234.56, ... }
```

### Frontend (Browser console):
```
✅ Vendors fetched: X
✅ Companies fetched: [{id: 1, code: "comp001", ...}, ...]
✅ Purchase Bills Response: [{companyCode: "comp001", purchases: [...]}, ...]
🧾 Sales Bills Response: [{companyCode: "comp001", sales: [...]}, ...]
✅ Sales metrics: { invoiceCount: 14, totalProfit: 1234.56, ... }
```

## If Still Not Working

### Option A: Run SQL queries manually (PHPMyAdmin)

1. Go to Database: `bhumisha`
2. Go to SQL tab
3. Paste and run `setup_sales_data.sql` content
4. Refresh page

### Option B: Check for errors

Run these queries to diagnose:

```sql
-- Check if companies table exists
SHOW TABLES LIKE 'companies';

-- Check if sales table has data
SELECT COUNT(*) FROM sales;

-- Check sales with NULL company_id
SELECT COUNT(*) FROM sales WHERE company_id IS NULL OR company_id = '';

-- Check if sale_items exists
SELECT COUNT(*) FROM sale_items;

-- Check if products and categories exist
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM categories;

-- Test the full query
SELECT s.id, s.bill_no, s.company_id, COUNT(si.id) as items
FROM sale_items si
INNER JOIN sales s ON si.sale_id = s.id
WHERE s.company_id = 'comp001'
GROUP BY s.id;
```

## Manual Data Entry (If needed)

If the migration doesn't work, manually add a company:

```sql
INSERT INTO companies (code, name, address, gst_no, contact_no, email, owner_name, status)
VALUES ('comp001', 'Default Company', '123 Street', '12ABCDE1234F1Z1', '9876543210', 'info@company.com', 'Owner', 'Active');

UPDATE sales SET company_id = 'comp001' WHERE company_id IS NULL OR company_id = '';
```

## What Was Fixed in Code

### Backend (`getallsalesbill.controller.js`):
- ✅ Fixed query to use global `sales` and `sale_items` tables
- ✅ Added WHERE clause: `s.company_id = ? OR s.company_id IS NULL`
- ✅ Added console logging for debugging
- ✅ Proper field name mapping (qty → quantity, etc.)

### Frontend (`Dashboard.jsx`):
- ✅ Added validation for empty company lists
- ✅ Added detailed console logging
- ✅ Fixed data extraction from new backend response structure
- ✅ Added fallback for NULL data

### Frontend (`SalesReports.jsx`):
- ✅ Fixed data extraction to use new backend response format
- ✅ Proper handling of `saleDetails`, `partyDetails`, `categoryDetails`

## Next Steps

After verification:
1. Add more companies through the UI (or manually)
2. Create new sales invoices with specific company codes
3. Charts will automatically update with new data
4. Test all filters and search functionality

---
**Questions?** Check the console logs (F12 → Console) for detailed debug information.
