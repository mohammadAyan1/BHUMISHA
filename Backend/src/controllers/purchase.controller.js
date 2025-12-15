const db = require("../config/db");
const { tn } = require("../services/tableName");
const { normalize } = require("../services/companyCode");

// Helper functions for unit conversions
function convertToKG(quantity, unit) {
  const qty = Number(quantity) || 0;
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return qty * 1000; // 1 ton = 1,000 KG
    case "quantal":
    case "quintal":
    case "qtl":
      return qty * 100; // 1 quintal = 100 KG
    case "kg":
      return qty; // Already in KG
    case "gram":
      return qty / 1000; // Convert grams to KG
    default:
      return qty; // Assume already in KG
  }
}

function getConversionFactor(unit) {
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return 1000; // 1 ton = 1000 kg
    case "quantal":
    case "quintal":
    case "qtl":
      return 100; // 1 quintal = 100 kg
    case "kg":
      return 1; // Already in kg
    case "gram":
      return 0.001; // 1 gram = 0.001 kg
    default:
      return 1; // Default to kg
  }
}

function convertToGramsBackend(quantity, unit) {
  const qty = Number(quantity) || 0;
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return qty * 1000 * 1000; // 1 ton = 1,000,000 grams
    case "quantal":
    case "quintal":
    case "qtl":
      return qty * 100 * 1000; // 1 quintal = 100,000 grams
    case "kg":
      return qty * 1000; // 1 kg = 1,000 grams
    case "gram":
      return qty;
    default:
      return qty; // Assume already in grams
  }
}

// Parse JSON when multipart sends fields in 'data'
function parseMixed(req) {
  if (req.body && typeof req.body === "object" && req.body.data) {
    try {
      return JSON.parse(req.body.data);
    } catch {
      return req.body;
    }
  }
  return req.body || {};
}

const purchaseController = {
  // Create Purchase (supports farmer) — per-company tables
  // create: async (req, res) => {
  //   const connection = db.promise();

  //   try {
  //     const code = normalize(req.headers["x-company-code"] || "");
  //     if (!code)
  //       return res.status(400).json({ error: "x-company-code required" });

  //     const purchasesTable = tn(code, "purchases");
  //     const itemsTable = tn(code, "purchase_items");

  //     let body;
  //     try {
  //       body = JSON.parse(req.body.data);
  //     } catch (e) {
  //       return res.status(400).json({ error: "Invalid data format" });
  //     }
  //     const {
  //       party_type,
  //       vendor_id,
  //       farmer_id,
  //       vendor_name,
  //       firm_name,
  //       gst_no,
  //       bill_no,
  //       bill_date,
  //       items,
  //       status,
  //       farmer_name,
  //       unit,
  //       paid_amount = 0,
  //       discount_percent = 0,
  //       discount_amount = 0,
  //       payment_method = "Cash",
  //       payment_note = "",
  //       terms_condition = "",
  //     } = body;

  //     console.log(body, "this is the body data");

  //     // Validations
  //     if (!Array.isArray(items) || items.length === 0) {
  //       return res
  //         .status(400)
  //         .json({ error: "Items must be a non-empty array" });
  //     }
  //     if (!bill_no)
  //       return res.status(400).json({ error: "bill_no is required" });
  //     if (!bill_date)
  //       return res.status(400).json({ error: "bill_date is required" });
  //     if (!Number.isFinite(Date.parse(bill_date))) {
  //       return res.status(400).json({ error: "Invalid bill_date" });
  //     }
  //     if (!party_type || !["vendor", "farmer"].includes(party_type)) {
  //       return res
  //         .status(400)
  //         .json({ error: "party_type must be 'vendor' or 'farmer'" });
  //     }

  //     const billUrl = req.file ? `/public/uploads/${req.file.filename}` : null;
  //     await connection.query("START TRANSACTION");
  //     const formattedDate = new Date(bill_date).toISOString().split("T")[0];

  //     // Calculate totals including GST and Discount for each item
  //     let taxableAmount = 0;
  //     let gstAmount = 0;
  //     let totalAmount = 0;
  //     let baseAmount = 0;
  //     let totalDiscountAmount = 0;

  //     items.forEach((item) => {
  //       const quantity = Number(item.size || 0);
  //       const unitVal = item.unit || "kg";
  //       const ratePerKg = Number(item.rate || 0);

  //       // Convert quantity to KG for calculations
  //       const quantityInKg = convertToKG(quantity, unitVal);

  //       // Calculate base amount (KG × Rate per KG)
  //       const itemBaseAmount = quantityInKg * ratePerKg;
  //       baseAmount += itemBaseAmount;

  //       // Calculate item discount
  //       const discountPercent = Number(
  //         item.discount_rate || item.d1_percent || 0
  //       );
  //       const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
  //       totalDiscountAmount += itemDiscountAmount;
  //       const itemAfterDiscount = itemBaseAmount - itemDiscountAmount;

  //       // Calculate item GST
  //       const gstPercent = Number(item.gst_percent || 0);
  //       const itemGstAmount = (itemAfterDiscount * gstPercent) / 100;

  //       taxableAmount += itemAfterDiscount;
  //       gstAmount += itemGstAmount;
  //       totalAmount += itemAfterDiscount + itemGstAmount;
  //     });

  //     // Apply overall discount if any
  //     const overallDiscountPercent = Number(discount_percent || 0);
  //     let overallDiscountAmount = 0;

  //     if (overallDiscountPercent > 0) {
  //       overallDiscountAmount = (totalAmount * overallDiscountPercent) / 100;
  //     } else if (discount_amount > 0) {
  //       overallDiscountAmount = Number(discount_amount || 0);
  //     }

  //     const finalTotalAmount = Math.max(0, totalAmount - overallDiscountAmount);

  //     // Resolve vendor/farmer
  //     let resolvedVendorId = null;
  //     let resolvedFarmerId = null;

  //     if (party_type === "vendor") {
  //       if (vendor_id) {
  //         resolvedVendorId = Number(vendor_id);
  //       } else if (vendor_name) {
  //         const [rows] = await connection.query(
  //           `SELECT id FROM vendors WHERE vendor_name=?`,
  //           [vendor_name]
  //         );
  //         if (rows.length) {
  //           resolvedVendorId = rows[0].id;
  //         } else {
  //           const [ins] = await connection.query(
  //             `INSERT INTO vendors (vendor_name, firm_name, gst_no, status) VALUES (?, ?, ?, ?)`,
  //             [vendor_name, firm_name || "", gst_no || null, "Active"]
  //           );
  //           resolvedVendorId = ins.insertId;
  //         }
  //       } else {
  //         await connection.query("ROLLBACK");
  //         return res.status(400).json({
  //           error: "vendor_id or vendor_name required for vendor party",
  //         });
  //       }
  //     } else {
  //       const fName = farmer_id ? null : body.farmer_name || farmer_name;
  //       if (farmer_id) {
  //         resolvedFarmerId = Number(farmer_id);
  //       } else if (fName) {
  //         const [rows] = await connection.query(
  //           `SELECT id FROM farmers WHERE name=?`,
  //           [String(fName).trim()]
  //         );
  //         if (rows.length) {
  //           resolvedFarmerId = rows[0].id;
  //         } else {
  //           const [ins] = await connection.query(
  //             `INSERT INTO farmers (name, status, balance, min_balance) VALUES (?, 'Active', 0.00, 5000.00)`,
  //             [String(fName).trim()]
  //           );
  //           resolvedFarmerId = ins.insertId;
  //         }
  //       } else {
  //         await connection.query("ROLLBACK");
  //         return res.status(400).json({
  //           error: "farmer_id or farmer_name required for farmer party",
  //         });
  //       }
  //     }

  //     // Update PO status if linked
  //     const po_id = body.po_id || body.linked_po_id;
  //     const po_item_ids = items.map((i) => i.po_item_id).filter(Boolean);
  //     if (po_id && po_item_ids.length > 0) {
  //       try {
  //         await connection.query(
  //           `UPDATE purchase_order_items SET status = 'Cancelled' WHERE id IN (?)`,
  //           [po_item_ids]
  //         );
  //       } catch (e) {
  //         if (
  //           e &&
  //           (e.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
  //             e.code === "WARN_DATA_TRUNCATED" ||
  //             e.errno === 1265 ||
  //             e.sqlState === "01000")
  //         ) {
  //           await connection.query(
  //             `UPDATE purchase_order_items SET status = 'Inactive' WHERE id IN (?)`,
  //             [po_item_ids]
  //           );
  //         } else {
  //           throw e;
  //         }
  //       }
  //     }

  //     // Ensure all columns exist in both tables
  //     await Promise.all([
  //       connection
  //         .query(
  //           `
  //           ALTER TABLE \`${purchasesTable}\`
  //           ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(10,2) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS base_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'kg',
  //           ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash',
  //           ADD COLUMN IF NOT EXISTS payment_note TEXT,
  //           ADD COLUMN IF NOT EXISTS terms_condition TEXT
  //         `
  //         )
  //         .catch((err) => {
  //           if (err.code !== "ER_DUP_FIELDNAME") throw err;
  //         }),

  //       connection
  //         .query(
  //           `
  //           ALTER TABLE \`${itemsTable}\`
  //           ADD COLUMN IF NOT EXISTS quantity_in_kg DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(10,2) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(10,2) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS base_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS amount_after_discount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS final_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(15,3) DEFAULT 0,
  //           ADD COLUMN IF NOT EXISTS unit_conversion_factor DECIMAL(15,3) DEFAULT 1
  //         `
  //         )
  //         .catch((err) => {
  //           if (err.code !== "ER_DUP_FIELDNAME") throw err;
  //         }),
  //     ]);

  //     // Insert purchase header
  //     const [purchaseResult] = await connection.query(
  //       `INSERT INTO \`${purchasesTable}\`
  //        (vendor_id, farmer_id, party_type, gst_no, bill_no, bill_date, total_amount,
  //         taxable_amount, gst_amount, base_amount, paid_amount, discount_percent, discount_amount,
  //         status, bill_img, unit, payment_method, payment_note, terms_condition)
  //      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  //       [
  //         resolvedVendorId,
  //         resolvedFarmerId,
  //         party_type,
  //         gst_no || null,
  //         bill_no,
  //         formattedDate,
  //         finalTotalAmount, // Final total after overall discount
  //         taxableAmount, // Taxable amount (after item discounts)
  //         gstAmount, // Total GST amount
  //         baseAmount, // Base amount before any discounts
  //         Number(paid_amount || 0),
  //         Number(discount_percent || 0),
  //         Number(overallDiscountAmount || 0),
  //         status || "Active",
  //         billUrl,
  //         unit || "kg",
  //         payment_method,
  //         payment_note,
  //         terms_condition,
  //       ]
  //     );
  //     const purchaseId = purchaseResult.insertId;

  //     // Insert purchase items with detailed calculations
  //     if (items.length > 0) {
  //       const values = items.map((i) => {
  //         const quantity = Number(i.size || 0);
  //         const unitVal = i.unit || "kg";
  //         const ratePerKg = Number(i.rate || 0);

  //         // Convert quantity to KG for calculations
  //         const quantityInKg = convertToKG(quantity, unitVal);

  //         // Calculate base amount (KG × Rate per KG)
  //         const itemBaseAmount = quantityInKg * ratePerKg;

  //         // Calculate discount
  //         const discountPercent = Number(i.discount_rate || i.d1_percent || 0);
  //         const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
  //         const amountAfterDiscount = itemBaseAmount - itemDiscountAmount;

  //         // Calculate GST
  //         const gstPercent = Number(i.gst_percent || 0);
  //         const itemGstAmount = (amountAfterDiscount * gstPercent) / 100;
  //         const finalAmount = amountAfterDiscount + itemGstAmount;

  //         // Get conversion factor
  //         const unitConversionFactor = getConversionFactor(unitVal);

  //         return [
  //           purchaseId,
  //           Number(i.product_id),
  //           Number(i.rate || 0),
  //           Number(i.size || 0),
  //           unitVal || "kg",
  //           quantityInKg,
  //           discountPercent,
  //           itemDiscountAmount,
  //           gstPercent,
  //           itemGstAmount,
  //           itemBaseAmount,
  //           amountAfterDiscount,
  //           finalAmount,
  //           unitConversionFactor,
  //           "Active",
  //         ];
  //       });

  //       await connection.query(
  //         `INSERT INTO \`${itemsTable}\`
  //          (purchase_id, product_id, rate, size, unit, quantity_in_kg,
  //           discount_percent, discount_amount, gst_percent, gst_amount,
  //           base_amount, amount_after_discount, final_amount, unit_conversion_factor, status)
  //          VALUES ?`,
  //         [values]
  //       );

  //       // Update product stock
  //       for (const i of items) {
  //         const [prodRows] = await connection.query(
  //           `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
  //           [i.product_id]
  //         );

  //         if (!prodRows.length) {
  //           await connection.query("ROLLBACK");
  //           return res
  //             .status(400)
  //             .json({ error: `product ${i.product_id} not found` });
  //         }

  //         const curr = Number(prodRows[0].size || 0);
  //         const incGrams = convertToGramsBackend(i.size, i.unit);

  //         if (!Number.isFinite(incGrams) || incGrams < 0) {
  //           await connection.query("ROLLBACK");
  //           return res
  //             .status(400)
  //             .json({ error: `invalid size for product ${i.product_id}` });
  //         }

  //         const newSize = curr + incGrams;

  //         await connection.query(`UPDATE products SET size = ? WHERE id = ?`, [
  //           newSize,
  //           i.product_id,
  //         ]);
  //       }
  //     }

  //     await connection.query("COMMIT");
  //     return res.status(201).json({
  //       message: "Purchase created successfully",
  //       purchase_id: purchaseId,
  //       bill_img: billUrl,
  //       totals: {
  //         base_amount: baseAmount,
  //         taxable_amount: taxableAmount,
  //         gst_amount: gstAmount,
  //         discount_amount: totalDiscountAmount + overallDiscountAmount,
  //         total_amount: finalTotalAmount,
  //         paid_amount: Number(paid_amount || 0),
  //         balance_due: finalTotalAmount - Number(paid_amount || 0),
  //       },
  //     });
  //   } catch (err) {
  //     try {
  //       await connection.query("ROLLBACK");
  //     } catch {}
  //     console.error("Purchase creation error:", err);
  //     return res
  //       .status(400)
  //       .json({ error: err.message || "Failed to create purchase" });
  //   }
  // },

  create: async (req, res) => {
    const connection = db.promise();

    try {
      const code = normalize(req.headers["x-company-code"] || "");
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      let body;
      try {
        body = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({ error: "Invalid data format" });
      }
      const {
        party_type,
        vendor_id,
        farmer_id,
        vendor_name,
        firm_name,
        gst_no,
        bill_no,
        bill_date,
        items,
        status,
        farmer_name,
        unit,
        paid_amount = 0,
        discount_percent = 0,
        discount_amount = 0,
        payment_method = "Cash",
        payment_note = "",
        terms_condition = "",
      } = body;

      console.log("Creating purchase with data:", body);

      // Validations
      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ error: "Items must be a non-empty array" });
      }
      if (!bill_no)
        return res.status(400).json({ error: "bill_no is required" });
      if (!bill_date)
        return res.status(400).json({ error: "bill_date is required" });
      if (!Number.isFinite(Date.parse(bill_date))) {
        return res.status(400).json({ error: "Invalid bill_date" });
      }
      if (!party_type || !["vendor", "farmer"].includes(party_type)) {
        return res
          .status(400)
          .json({ error: "party_type must be 'vendor' or 'farmer'" });
      }

      const billUrl = req.file ? `/public/uploads/${req.file.filename}` : null;
      await connection.query("START TRANSACTION");
      const formattedDate = new Date(bill_date).toISOString().split("T")[0];

      // Calculate totals including GST and Discount for each item
      let taxableAmount = 0;
      let gstAmount = 0;
      let totalAmount = 0;
      let baseAmount = 0;
      let totalDiscountAmount = 0;

      items.forEach((item) => {
        const quantity = Number(item.size || 0);
        const unitVal = item.unit || "kg";
        const ratePerKg = Number(item.rate || 0);

        // Convert quantity to KG for calculations
        const quantityInKg = convertToKG(quantity, unitVal);

        // Calculate base amount (KG × Rate per KG)
        const itemBaseAmount = quantityInKg * ratePerKg;
        baseAmount += itemBaseAmount;

        // Calculate item discount
        const discountPercent = Number(
          item.discount_rate || item.d1_percent || 0
        );
        const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
        totalDiscountAmount += itemDiscountAmount;
        const itemAfterDiscount = itemBaseAmount - itemDiscountAmount;

        // Calculate item GST
        const gstPercent = Number(item.gst_percent || 0);
        const itemGstAmount = (itemAfterDiscount * gstPercent) / 100;

        taxableAmount += itemAfterDiscount;
        gstAmount += itemGstAmount;
        totalAmount += itemAfterDiscount + itemGstAmount;
      });

      // Apply overall discount if any
      const overallDiscountPercent = Number(discount_percent || 0);
      let overallDiscountAmount = 0;

      if (overallDiscountPercent > 0) {
        overallDiscountAmount = (totalAmount * overallDiscountPercent) / 100;
      } else if (discount_amount > 0) {
        overallDiscountAmount = Number(discount_amount || 0);
      }

      const finalTotalAmount = Math.max(0, totalAmount - overallDiscountAmount);

      // Resolve vendor/farmer
      let resolvedVendorId = null;
      let resolvedFarmerId = null;

      if (party_type === "vendor") {
        if (vendor_id) {
          resolvedVendorId = Number(vendor_id);
        } else if (vendor_name) {
          const [rows] = await connection.query(
            `SELECT id FROM vendors WHERE vendor_name=?`,
            [vendor_name]
          );
          if (rows.length) {
            resolvedVendorId = rows[0].id;
          } else {
            const [ins] = await connection.query(
              `INSERT INTO vendors (vendor_name, firm_name, gst_no, status) VALUES (?, ?, ?, ?)`,
              [vendor_name, firm_name || "", gst_no || null, "Active"]
            );
            resolvedVendorId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "vendor_id or vendor_name required for vendor party",
          });
        }
      } else {
        const fName = farmer_id ? null : body.farmer_name || farmer_name;
        if (farmer_id) {
          resolvedFarmerId = Number(farmer_id);
        } else if (fName) {
          const [rows] = await connection.query(
            `SELECT id FROM farmers WHERE name=?`,
            [String(fName).trim()]
          );
          if (rows.length) {
            resolvedFarmerId = rows[0].id;
          } else {
            const [ins] = await connection.query(
              `INSERT INTO farmers (name, status, balance, min_balance) VALUES (?, 'Active', 0.00, 5000.00)`,
              [String(fName).trim()]
            );
            resolvedFarmerId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "farmer_id or farmer_name required for farmer party",
          });
        }
      }

      // Update PO status if linked
      const po_id = body.po_id || body.linked_po_id;
      const po_item_ids = items.map((i) => i.po_item_id).filter(Boolean);
      if (po_id && po_item_ids.length > 0) {
        try {
          await connection.query(
            `UPDATE purchase_order_items SET status = 'Cancelled' WHERE id IN (?)`,
            [po_item_ids]
          );
        } catch (e) {
          if (
            e &&
            (e.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
              e.code === "WARN_DATA_TRUNCATED" ||
              e.errno === 1265 ||
              e.sqlState === "01000")
          ) {
            await connection.query(
              `UPDATE purchase_order_items SET status = 'Inactive' WHERE id IN (?)`,
              [po_item_ids]
            );
          } else {
            throw e;
          }
        }
      }

      // 1. Check and add columns WITHOUT IF NOT EXISTS (for MySQL 5.7)
      // For MySQL 5.7, we need to check if column exists first, then add it

      // First, let's check what columns already exist
      const [existingPurchaseColumns] = await connection.query(
        `SHOW COLUMNS FROM \`${purchasesTable}\``
      );

      const existingPurchaseColumnNames = existingPurchaseColumns.map(
        (col) => col.Field
      );

      // Columns to potentially add to purchases table
      const purchaseColumnsToAdd = [
        { name: "paid_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "discount_percent", type: "DECIMAL(10,2) DEFAULT 0" },
        { name: "discount_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "gst_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "taxable_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "base_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "payment_method", type: "VARCHAR(50) DEFAULT 'Cash'" },
        { name: "payment_note", type: "TEXT" },
        { name: "terms_condition", type: "TEXT" },
        { name: "unit", type: "VARCHAR(50) DEFAULT 'kg'" },
      ];

      // Add missing columns
      for (const column of purchaseColumnsToAdd) {
        if (!existingPurchaseColumnNames.includes(column.name)) {
          try {
            await connection.query(
              `ALTER TABLE \`${purchasesTable}\` ADD COLUMN ${column.name} ${column.type}`
            );
            console.log(`Added column ${column.name} to ${purchasesTable}`);
          } catch (err) {
            console.error(`Error adding column ${column.name}:`, err.message);
            // Continue even if there's an error adding a column
          }
        }
      }

      // Check items table columns
      const [existingItemColumns] = await connection.query(
        `SHOW COLUMNS FROM \`${itemsTable}\``
      );

      const existingItemColumnNames = existingItemColumns.map(
        (col) => col.Field
      );

      // Columns to potentially add to purchase_items table
      const itemColumnsToAdd = [
        { name: "quantity_in_kg", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "discount_percent", type: "DECIMAL(10,2) DEFAULT 0" },
        { name: "discount_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "gst_percent", type: "DECIMAL(10,2) DEFAULT 0" },
        { name: "gst_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "base_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "amount_after_discount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "final_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "taxable_amount", type: "DECIMAL(15,3) DEFAULT 0" },
        { name: "unit_conversion_factor", type: "DECIMAL(15,3) DEFAULT 1" },
      ];

      // Add missing columns to items table
      for (const column of itemColumnsToAdd) {
        if (!existingItemColumnNames.includes(column.name)) {
          try {
            await connection.query(
              `ALTER TABLE \`${itemsTable}\` ADD COLUMN ${column.name} ${column.type}`
            );
            console.log(`Added column ${column.name} to ${itemsTable}`);
          } catch (err) {
            console.error(`Error adding column ${column.name}:`, err.message);
            // Continue even if there's an error adding a column
          }
        }
      }

      // 2. Build dynamic INSERT query based on available columns
      // First check which columns actually exist now
      const [finalPurchaseColumns] = await connection.query(
        `SHOW COLUMNS FROM \`${purchasesTable}\``
      );

      const finalPurchaseColumnNames = finalPurchaseColumns.map(
        (col) => col.Field
      );

      // Build column list and values based on what exists
      let insertColumns = [
        "vendor_id",
        "farmer_id",
        "party_type",
        "gst_no",
        "bill_no",
        "bill_date",
        "total_amount",
        "status",
        "bill_img",
      ];

      let insertValues = [
        resolvedVendorId,
        resolvedFarmerId,
        party_type,
        gst_no || null,
        bill_no,
        formattedDate,
        finalTotalAmount,
        status || "Active",
        billUrl,
      ];

      // Add optional columns if they exist
      const optionalColumns = [
        { name: "taxable_amount", value: taxableAmount },
        { name: "gst_amount", value: gstAmount },
        { name: "base_amount", value: baseAmount },
        { name: "paid_amount", value: Number(paid_amount || 0) },
        { name: "discount_percent", value: Number(discount_percent || 0) },
        { name: "discount_amount", value: Number(overallDiscountAmount || 0) },
        { name: "unit", value: unit || "kg" },
        { name: "payment_method", value: payment_method },
        { name: "payment_note", value: payment_note },
        { name: "terms_condition", value: terms_condition },
      ];

      for (const col of optionalColumns) {
        if (finalPurchaseColumnNames.includes(col.name)) {
          insertColumns.push(col.name);
          insertValues.push(col.value);
        }
      }

      // Create placeholders for the query
      const placeholders = insertValues.map(() => "?").join(", ");

      // 3. Insert the purchase
      const [purchaseResult] = await connection.query(
        `INSERT INTO \`${purchasesTable}\` (${insertColumns.join(", ")}) 
       VALUES (${placeholders})`,
        insertValues
      );

      const purchaseId = purchaseResult.insertId;

      console.log(`Purchase created with ID: ${purchaseId}`);

      // 4. Insert purchase items with detailed calculations
      if (items.length > 0) {
        // Check what columns exist in items table
        const [finalItemColumns] = await connection.query(
          `SHOW COLUMNS FROM \`${itemsTable}\``
        );

        const finalItemColumnNames = finalItemColumns.map((col) => col.Field);

        const values = items.map((i) => {
          const quantity = Number(i.size || 0);
          const unitVal = i.unit || "kg";
          const ratePerKg = Number(i.rate || 0);

          // Convert quantity to KG for calculations
          const quantityInKg = convertToKG(quantity, unitVal);

          // Calculate base amount (KG × Rate per KG)
          const itemBaseAmount = quantityInKg * ratePerKg;

          // Calculate discount
          const discountPercent = Number(i.discount_rate || i.d1_percent || 0);
          const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
          const amountAfterDiscount = itemBaseAmount - itemDiscountAmount;

          // Calculate GST
          const gstPercent = Number(i.gst_percent || 0);
          const itemGstAmount = (amountAfterDiscount * gstPercent) / 100;
          const finalAmount = amountAfterDiscount + itemGstAmount;

          // Get conversion factor
          const unitConversionFactor = getConversionFactor(unitVal);

          // Build item values based on available columns
          const itemValues = [
            purchaseId,
            Number(i.product_id),
            Number(i.rate || 0),
            Number(i.size || 0),
            unitVal || "kg",
            "Active", // status
          ];

          // Add optional columns if they exist
          const optionalItemValues = [
            { name: "quantity_in_kg", value: quantityInKg },
            { name: "discount_percent", value: discountPercent },
            { name: "discount_amount", value: itemDiscountAmount },
            { name: "gst_percent", value: gstPercent },
            { name: "gst_amount", value: itemGstAmount },
            { name: "base_amount", value: itemBaseAmount },
            { name: "amount_after_discount", value: amountAfterDiscount },
            { name: "final_amount", value: finalAmount },
            { name: "taxable_amount", value: amountAfterDiscount },
            { name: "unit_conversion_factor", value: unitConversionFactor },
          ];

          // Check which optional columns exist and add their values
          for (const col of optionalItemValues) {
            if (finalItemColumnNames.includes(col.name)) {
              itemValues.push(col.value);
            }
          }

          return itemValues;
        });

        console.log(`Inserting ${values.length} items...`);

        // Build item column list
        let itemInsertColumns = [
          "purchase_id",
          "product_id",
          "rate",
          "size",
          "unit",
          "status",
        ];

        // Add optional columns that exist
        for (const col of [
          "quantity_in_kg",
          "discount_percent",
          "discount_amount",
          "gst_percent",
          "gst_amount",
          "base_amount",
          "amount_after_discount",
          "final_amount",
          "taxable_amount",
          "unit_conversion_factor",
        ]) {
          if (finalItemColumnNames.includes(col)) {
            itemInsertColumns.push(col);
          }
        }

        // Create placeholders for items
        const itemPlaceholders = values[0].map(() => "?").join(", ");
        const allItemPlaceholders = values
          .map(() => `(${itemPlaceholders})`)
          .join(", ");

        // Flatten values array
        const flatValues = values.flat();

        await connection.query(
          `INSERT INTO \`${itemsTable}\` (${itemInsertColumns.join(", ")}) 
         VALUES ${allItemPlaceholders}`,
          flatValues
        );

        // Update product stock
        for (const i of items) {
          const [prodRows] = await connection.query(
            `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
            [i.product_id]
          );

          if (!prodRows.length) {
            await connection.query("ROLLBACK");
            return res
              .status(400)
              .json({ error: `product ${i.product_id} not found` });
          }

          const curr = Number(prodRows[0].size || 0);
          const incGrams = convertToGramsBackend(i.size, i.unit);

          if (!Number.isFinite(incGrams) || incGrams < 0) {
            await connection.query("ROLLBACK");
            return res
              .status(400)
              .json({ error: `invalid size for product ${i.product_id}` });
          }

          const newSize = curr + incGrams;

          await connection.query(`UPDATE products SET size = ? WHERE id = ?`, [
            newSize,
            i.product_id,
          ]);

          console.log(
            `Updated product ${i.product_id} stock from ${curr}g to ${newSize}g (+${incGrams}g)`
          );
        }
      }

      await connection.query("COMMIT");

      return res.status(201).json({
        message: "Purchase created successfully",
        purchase_id: purchaseId,
        bill_img: billUrl,
        totals: {
          base_amount: baseAmount,
          taxable_amount: taxableAmount,
          gst_amount: gstAmount,
          item_discount_amount: totalDiscountAmount,
          overall_discount_amount: overallDiscountAmount,
          total_discount_amount: totalDiscountAmount + overallDiscountAmount,
          total_amount: finalTotalAmount,
          paid_amount: Number(paid_amount || 0),
          balance_due: finalTotalAmount - Number(paid_amount || 0),
        },
      });
    } catch (err) {
      try {
        await connection.query("ROLLBACK");
      } catch {}
      console.error("Purchase creation error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Failed to create purchase" });
    }
  },

  // Update Purchase
  update: async (req, res) => {
    const connection = db.promise();
    try {
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      const { id } = req.params;
      const body = parseMixed(req);
      const {
        party_type,
        vendor_id,
        farmer_id,
        vendor_name,
        farmer_name,
        firm_name,
        gst_no,
        bill_no,
        bill_date,
        status,
        items,
        paid_amount = 0,
        discount_percent = 0,
        discount_amount = 0,
        payment_method = "Cash",
        payment_note = "",
        terms_condition = "",
      } = body;

      // Validations
      if (!bill_no)
        return res.status(400).json({ error: "bill_no is required" });
      if (!bill_date)
        return res.status(400).json({ error: "bill_date is required" });
      if (!Number.isFinite(Date.parse(bill_date))) {
        return res.status(400).json({ error: "Invalid bill_date" });
      }
      if (!party_type || !["vendor", "farmer"].includes(party_type)) {
        return res
          .status(400)
          .json({ error: "party_type must be 'vendor' or 'farmer'" });
      }

      await connection.query("START TRANSACTION");

      // Calculate new totals if items are provided
      let taxableAmount = 0;
      let gstAmount = 0;
      let totalAmount = 0;
      let baseAmount = 0;
      let totalDiscountAmount = 0;

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const quantity = Number(item.size || 0);
          const unitVal = item.unit || "kg";
          const ratePerKg = Number(item.rate || 0);

          // Convert quantity to KG for calculations
          const quantityInKg = convertToKG(quantity, unitVal);

          // Calculate base amount (KG × Rate per KG)
          const itemBaseAmount = quantityInKg * ratePerKg;
          baseAmount += itemBaseAmount;

          // Calculate item discount
          const discountPercent = Number(
            item.discount_rate || item.d1_percent || 0
          );
          const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
          totalDiscountAmount += itemDiscountAmount;
          const itemAfterDiscount = itemBaseAmount - itemDiscountAmount;

          // Calculate item GST
          const gstPercent = Number(item.gst_percent || 0);
          const itemGstAmount = (itemAfterDiscount * gstPercent) / 100;

          taxableAmount += itemAfterDiscount;
          gstAmount += itemGstAmount;
          totalAmount += itemAfterDiscount + itemGstAmount;
        });

        // Apply overall discount if any
        const overallDiscountPercent = Number(discount_percent || 0);
        let overallDiscountAmount = 0;

        if (overallDiscountPercent > 0) {
          overallDiscountAmount = (totalAmount * overallDiscountPercent) / 100;
        } else if (discount_amount > 0) {
          overallDiscountAmount = Number(discount_amount || 0);
        }

        totalAmount = Math.max(0, totalAmount - overallDiscountAmount);
      }

      // Resolve vendor/farmer
      let resolvedVendorId = null;
      let resolvedFarmerId = null;

      if (party_type === "vendor") {
        if (vendor_id) {
          resolvedVendorId = Number(vendor_id);
        } else if (vendor_name) {
          const [rows] = await connection.query(
            `SELECT id FROM vendors WHERE vendor_name=?`,
            [vendor_name]
          );
          if (rows.length) resolvedVendorId = rows[0].id;
          else {
            const [ins] = await connection.query(
              `INSERT INTO vendors (vendor_name, firm_name, gst_no, status) VALUES (?, ?, ?, ?)`,
              [vendor_name, firm_name || "", gst_no || null, "Active"]
            );
            resolvedVendorId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "vendor_id or vendor_name required for vendor party",
          });
        }
      } else {
        if (farmer_id) {
          resolvedFarmerId = Number(farmer_id);
        } else if (farmer_name) {
          const [rows] = await connection.query(
            `SELECT id FROM farmers WHERE name=?`,
            [farmer_name]
          );
          if (rows.length) resolvedFarmerId = rows[0].id;
          else {
            const [ins] = await connection.query(
              `INSERT INTO farmers (name, status, balance, min_balance) VALUES (?, 'Active', 0.00, 5000.00)`,
              [farmer_name]
            );
            resolvedFarmerId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "farmer_id or farmer_name required for farmer party",
          });
        }
      }

      const formattedDate = new Date(bill_date).toISOString().split("T")[0];
      const billUrl = req.file ? `/public/uploads/${req.file.filename}` : null;

      // Update purchase header
      let setSql = `vendor_id=?, farmer_id=?, party_type=?, gst_no=?, bill_no=?, 
                    bill_date=?, status=?, paid_amount=?, discount_percent=?, 
                    discount_amount=?, payment_method=?, payment_note=?, terms_condition=?`;

      const setVals = [
        resolvedVendorId,
        resolvedFarmerId,
        party_type,
        gst_no || null,
        bill_no,
        formattedDate,
        status || "Active",
        Number(paid_amount || 0),
        Number(discount_percent || 0),
        Number(discount_amount || 0),
        payment_method,
        payment_note,
        terms_condition,
      ];

      // Add financial columns if items are provided
      if (Array.isArray(items)) {
        setSql += `, total_amount=?, taxable_amount=?, gst_amount=?, base_amount=?`;
        setVals.push(totalAmount, taxableAmount, gstAmount, baseAmount);
      }

      if (req.file) {
        setSql += ", bill_img=?";
        setVals.push(billUrl);
      }

      await connection.query(
        `UPDATE \`${purchasesTable}\` SET ${setSql} WHERE id=?`,
        [...setVals, id]
      );

      // Update items if provided
      if (Array.isArray(items)) {
        // Get existing items
        const [existingRows] = await connection.query(
          `SELECT id, product_id, size FROM \`${itemsTable}\` WHERE purchase_id = ?`,
          [id]
        );
        const existingMap = {};
        const existingIds = [];

        for (const r of existingRows) {
          existingMap[r.id] = r;
          existingIds.push(r.id);
        }

        const incomingIds = [];

        for (const item of items) {
          const itemId = item.id ? Number(item.id) : null;
          const quantity = Number(item.size || 0);
          const unitVal = item.unit || "kg";
          const ratePerKg = Number(item.rate || 0);
          const prodId = Number(item.product_id);

          // Calculate item details
          const quantityInKg = convertToKG(quantity, unitVal);
          const itemBaseAmount = quantityInKg * ratePerKg;
          const discountPercent = Number(
            item.discount_rate || item.d1_percent || 0
          );
          const discountAmount = (itemBaseAmount * discountPercent) / 100;
          const amountAfterDiscount = itemBaseAmount - discountAmount;
          const gstPercent = Number(item.gst_percent || 0);
          const gstAmount = (amountAfterDiscount * gstPercent) / 100;
          const finalAmount = amountAfterDiscount + gstAmount;
          const unitConversionFactor = getConversionFactor(unitVal);

          if (itemId) {
            incomingIds.push(itemId);
            const prev = existingMap[itemId];
            const prevSize = prev ? Number(prev.size || 0) : 0;
            const sizeDelta = quantity - prevSize;

            // Update item with new calculations
            await connection.query(
              `UPDATE \`${itemsTable}\` SET 
               product_id=?, rate=?, size=?, unit=?, quantity_in_kg=?,
               discount_percent=?, discount_amount=?, gst_percent=?, gst_amount=?,
               base_amount=?, amount_after_discount=?, final_amount=?,
               unit_conversion_factor=?, status=? 
               WHERE id=?`,
              [
                prodId,
                ratePerKg,
                quantity,
                unitVal,
                quantityInKg,
                discountPercent,
                discountAmount,
                gstPercent,
                gstAmount,
                itemBaseAmount,
                amountAfterDiscount,
                finalAmount,
                unitConversionFactor,
                item.status || "Active",
                itemId,
              ]
            );

            // Update product stock if quantity changed
            if (sizeDelta !== 0) {
              const incGrams = convertToGramsBackend(sizeDelta, unitVal);
              const [prodRows] = await connection.query(
                `SELECT id, size FROM products WHERE id=? FOR UPDATE`,
                [prodId]
              );

              if (!prodRows.length) {
                await connection.query("ROLLBACK");
                return res
                  .status(400)
                  .json({ error: `product ${prodId} not found` });
              }

              const curr = Number(prodRows[0].size || 0);
              const updated = curr + incGrams;

              if (!Number.isFinite(updated) || updated < 0) {
                await connection.query("ROLLBACK");
                return res.status(400).json({
                  error: `stock would go negative for product ${prodId}`,
                });
              }

              await connection.query(`UPDATE products SET size=? WHERE id=?`, [
                updated,
                prodId,
              ]);
            }
          } else {
            // Insert new item
            await connection.query(
              `INSERT INTO \`${itemsTable}\` 
               (purchase_id, product_id, rate, size, unit, quantity_in_kg,
                discount_percent, discount_amount, gst_percent, gst_amount,
                base_amount, amount_after_discount, final_amount,
                unit_conversion_factor, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                prodId,
                ratePerKg,
                quantity,
                unitVal,
                quantityInKg,
                discountPercent,
                discountAmount,
                gstPercent,
                gstAmount,
                itemBaseAmount,
                amountAfterDiscount,
                finalAmount,
                unitConversionFactor,
                "Active",
              ]
            );

            // Update product stock for new item
            const incGrams = convertToGramsBackend(quantity, unitVal);
            const [prodRows] = await connection.query(
              `SELECT id, size FROM products WHERE id=? FOR UPDATE`,
              [prodId]
            );

            if (!prodRows.length) {
              await connection.query("ROLLBACK");
              return res
                .status(400)
                .json({ error: `product ${prodId} not found` });
            }

            const curr = Number(prodRows[0].size || 0);
            const updated = curr + incGrams;

            await connection.query(`UPDATE products SET size=? WHERE id=?`, [
              updated,
              prodId,
            ]);
          }
        }

        // Delete removed items
        const toDelete = existingIds.filter(
          (eid) => !incomingIds.includes(eid)
        );

        if (toDelete.length > 0) {
          for (const delId of toDelete) {
            const r = existingMap[delId];
            if (r) {
              // Revert stock for deleted item
              const incGrams = convertToGramsBackend(-r.size, "kg"); // Convert based on stored unit if available
              const [prodRows] = await connection.query(
                `SELECT id, size FROM products WHERE id=? FOR UPDATE`,
                [r.product_id]
              );

              if (prodRows.length) {
                const curr = Number(prodRows[0].size || 0);
                const updated = curr - incGrams;

                if (updated < 0) {
                  await connection.query("ROLLBACK");
                  return res.status(400).json({
                    error: `stock would go negative for product ${r.product_id}`,
                  });
                }

                await connection.query(
                  `UPDATE products SET size=? WHERE id=?`,
                  [updated, r.product_id]
                );
              }

              await connection.query(
                `DELETE FROM \`${itemsTable}\` WHERE id = ?`,
                [delId]
              );
            }
          }
        }
      }

      await connection.query("COMMIT");
      return res.json({
        message: "Purchase updated successfully",
        bill_img: billUrl || undefined,
        totals: {
          total_amount: totalAmount,
          taxable_amount: taxableAmount,
          gst_amount: gstAmount,
          base_amount: baseAmount,
          paid_amount: Number(paid_amount || 0),
          balance_due: totalAmount - Number(paid_amount || 0),
        },
      });
    } catch (err) {
      try {
        await connection.query("ROLLBACK");
      } catch {}
      console.error("Purchase update error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Failed to update purchase" });
    }
  },

  // Get all purchases — per-company
  getAll: async (req, res) => {
    try {
      const connection = db.promise();
      const code = String(
        req.headers["x-company-code"] || req.query.company_code || ""
      ).toLowerCase();
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      const [purchases] = await connection.query(`
        SELECT
          p.id, p.bill_no, p.bill_date, p.total_amount, p.status, p.party_type, p.bill_img,
          p.paid_amount, p.discount_percent, p.discount_amount, p.gst_amount, p.taxable_amount,
          p.base_amount, p.payment_method, p.payment_note, p.terms_condition, p.unit as purchase_unit,
          v.vendor_name, v.firm_name, v.address as vendor_address, v.contact_number as vendor_contact,
          f.name AS farmer_name, f.contact_number as farmer_contact
        FROM \`${purchasesTable}\` p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN farmers f ON p.farmer_id = f.id
        ORDER BY p.id DESC
      `);

      if (purchases.length === 0) return res.json([]);

      const purchaseIds = purchases.map((p) => p.id);
      const [items] = await connection.query(
        `
        SELECT 
          pi.*, 
          pr.product_name,
          pr.hsn_code,
          (pi.base_amount - pi.discount_amount) as taxable,
          (pi.base_amount - pi.discount_amount + pi.gst_amount) as final_amount
        FROM \`${itemsTable}\` pi
        JOIN products pr ON pi.product_id = pr.id
        WHERE pi.purchase_id IN (?)
        ORDER BY pi.id ASC
        `,
        [purchaseIds]
      );

      const purchasesWithItems = purchases.map((p) => {
        const party_name =
          p.party_type === "vendor" ? p.vendor_name : p.farmer_name;
        const contact_number =
          p.party_type === "vendor" ? p.vendor_contact : p.farmer_contact;
        const address = p.party_type === "vendor" ? p.vendor_address : null;

        // Calculate remaining amount
        const remaining_amount = p.total_amount - (p.paid_amount || 0);

        return {
          ...p,
          party_name,
          contact_number,
          address,
          remaining_amount,
          items: items.filter((i) => i.purchase_id === p.id),
        };
      });

      res.json(purchasesWithItems);
    } catch (err) {
      console.error("GetAll purchases error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Get purchase by ID — per-company
  // getById: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const connection = db.promise();

  //     const code = String(
  //       req.headers["x-company-code"] || req.query.company_code || ""
  //     ).toLowerCase();
  //     if (!code)
  //       return res.status(400).json({ error: "x-company-code required" });

  //     const purchasesTable = tn(code, "purchases");
  //     const itemsTable = tn(code, "purchase_items");

  //     const [purchaseRows] = await connection.query(
  //       `
  //       SELECT
  //         p.*,
  //         v.vendor_name, v.firm_name, v.address as vendor_address,
  //         v.contact_number as vendor_contact, v.gst_no as vendor_gst_no,
  //         f.name AS farmer_name, f.contact_number as farmer_contact
  //       FROM \`${purchasesTable}\` p
  //       LEFT JOIN vendors v ON p.vendor_id = v.id
  //       LEFT JOIN farmers f ON p.farmer_id = f.id
  //       WHERE p.id = ?
  //       `,
  //       [id]
  //     );

  //     if (purchaseRows.length === 0)
  //       return res.status(404).json({ message: "Purchase not found" });

  //     const [items] = await connection.query(
  //       `SELECT
  //         pi.*,
  //         pr.product_name,
  //         pr.hsn_code,
  //         pr.available as current_stock,
  //         (pi.base_amount - pi.discount_amount) as taxable,
  //         (pi.base_amount - pi.discount_amount + pi.gst_amount) as final_amount
  //        FROM \`${itemsTable}\` pi
  //        JOIN products pr ON pi.product_id = pr.id
  //        WHERE pi.purchase_id = ?
  //        ORDER BY pi.id ASC`,
  //       [id]
  //     );

  //     const purchase = purchaseRows[0];
  //     const party_name =
  //       purchase.party_type === "vendor"
  //         ? purchase.vendor_name
  //         : purchase.farmer_name;

  //     const contact_number =
  //       purchase.party_type === "vendor"
  //         ? purchase.vendor_contact
  //         : purchase.farmer_contact;

  //     const address =
  //       purchase.party_type === "vendor" ? purchase.vendor_address : null;

  //     const gst_no =
  //       purchase.party_type === "vendor" ? purchase.vendor_gst_no : null;

  //     // Calculate summary
  //     const remaining_amount =
  //       purchase.total_amount - (purchase.paid_amount || 0);
  //     const balance_due = remaining_amount > 0 ? remaining_amount : 0;

  //     res.json({
  //       ...purchase,
  //       party_name,
  //       contact_number,
  //       address,
  //       gst_no,
  //       remaining_amount,
  //       balance_due,
  //       items,
  //       summary: {
  //         total_items: items.length,
  //         total_quantity: items.reduce(
  //           (sum, item) => sum + (item.quantity_in_kg || 0),
  //           0
  //         ),
  //         base_amount: purchase.base_amount || 0,
  //         total_discount:
  //           (purchase.discount_amount || 0) +
  //           items.reduce((sum, item) => sum + (item.discount_amount || 0), 0),
  //         taxable_amount: purchase.taxable_amount || 0,
  //         gst_amount: purchase.gst_amount || 0,
  //         total_amount: purchase.total_amount || 0,
  //         paid_amount: purchase.paid_amount || 0,
  //         balance_due,
  //       },
  //     });
  //   } catch (err) {
  //     console.error("GetById purchase error:", err);
  //     res.status(500).json({ error: err.message });
  //   }
  // },

  // Get purchase by ID — per-company
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const connection = db.promise();

      const code = String(
        req.headers["x-company-code"] || req.query.company_code || ""
      ).toLowerCase();
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      const [purchaseRows] = await connection.query(
        `
      SELECT 
        p.*,
        v.vendor_name, v.firm_name, v.address as vendor_address, 
        v.contact_number as vendor_contact, v.gst_no as vendor_gst_no,
        f.name AS farmer_name, f.contact_number as farmer_contact
      FROM \`${purchasesTable}\` p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN farmers f ON p.farmer_id = f.id
      WHERE p.id = ?
      `,
        [id]
      );

      if (purchaseRows.length === 0)
        return res.status(404).json({ message: "Purchase not found" });

      // Get items - FIXED: Use 'size' instead of 'available' since that's what exists
      let items = [];
      try {
        const [itemRows] = await connection.query(
          `SELECT 
          pi.*, 
          pr.product_name,
          pr.hsn_code,
          pr.size as current_stock,  // Using 'size' column instead of 'available'
          (pi.base_amount - pi.discount_amount) as taxable,
          (pi.base_amount - pi.discount_amount + pi.gst_amount) as final_amount
         FROM \`${itemsTable}\` pi
         JOIN products pr ON pi.product_id = pr.id
         WHERE pi.purchase_id = ?
         ORDER BY pi.id ASC`,
          [id]
        );
        items = itemRows;
      } catch (err) {
        console.error(
          "Error fetching items with financial details:",
          err.message
        );
        // Fallback to basic query
        const [itemRows] = await connection.query(
          `SELECT 
          pi.*, 
          pr.product_name,
          pr.hsn_code,
          pr.size as current_stock
         FROM \`${itemsTable}\` pi
         JOIN products pr ON pi.product_id = pr.id
         WHERE pi.purchase_id = ?
         ORDER BY pi.id ASC`,
          [id]
        );
        items = itemRows;
      }

      const purchase = purchaseRows[0];
      const party_name =
        purchase.party_type === "vendor"
          ? purchase.vendor_name
          : purchase.farmer_name;

      const contact_number =
        purchase.party_type === "vendor"
          ? purchase.vendor_contact
          : purchase.farmer_contact;

      const address =
        purchase.party_type === "vendor" ? purchase.vendor_address : null;

      const gst_no =
        purchase.party_type === "vendor" ? purchase.vendor_gst_no : null;

      // Calculate summary with safe defaults
      const total_amount = Number(purchase.total_amount || 0);
      const paid_amount = Number(purchase.paid_amount || 0);
      const remaining_amount = total_amount - paid_amount;
      const balance_due = remaining_amount > 0 ? remaining_amount : 0;

      // Calculate item-based totals if financial columns don't exist
      let base_amount = Number(purchase.base_amount || 0);
      let taxable_amount = Number(purchase.taxable_amount || 0);
      let gst_amount = Number(purchase.gst_amount || 0);
      let total_discount = Number(purchase.discount_amount || 0);

      // If financial columns don't exist, calculate from items
      if (!purchase.base_amount && items.length > 0) {
        items.forEach((item) => {
          const size = Number(item.size || 0);
          const unit = item.unit || "kg";
          const rate = Number(item.rate || 0);

          // Convert to KG if needed
          const quantityInKg = convertToKG(size, unit);
          const itemBase = quantityInKg * rate;

          base_amount += itemBase;

          // Calculate discount if available
          const discountPercent = Number(item.discount_percent || 0);
          const itemDiscount = (itemBase * discountPercent) / 100;
          const itemAfterDiscount = itemBase - itemDiscount;

          // Calculate GST if available
          const gstPercent = Number(item.gst_percent || 0);
          const itemGst = (itemAfterDiscount * gstPercent) / 100;

          taxable_amount += itemAfterDiscount;
          gst_amount += itemGst;
          total_discount += itemDiscount;
        });
      }

      res.json({
        ...purchase,
        party_name,
        contact_number,
        address,
        gst_no,
        remaining_amount,
        balance_due,
        items,
        summary: {
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => {
            const size = Number(item.size || 0);
            const unit = item.unit || "kg";
            return sum + convertToKG(size, unit);
          }, 0),
          base_amount: base_amount,
          total_discount:
            total_discount + Number(purchase.discount_amount || 0),
          taxable_amount: taxable_amount || purchase.taxable_amount || 0,
          gst_amount: gst_amount || purchase.gst_amount || 0,
          total_amount: total_amount,
          paid_amount: paid_amount,
          balance_due: balance_due,
        },
      });
    } catch (err) {
      console.error("GetById purchase error:", err);

      // Provide more specific error message
      if (err.message.includes("Unknown column")) {
        return res.status(500).json({
          error: "Database column mismatch",
          details: err.message,
          suggestion:
            "Please check if all required columns exist in the products table",
        });
      }

      res.status(500).json({ error: err.message });
    }
  },

  // Get purchase for PO (for creating purchase from PO)
  getPOForPurchase: async (req, res) => {
    try {
      const { poId } = req.params;
      const connection = db.promise();

      const code = String(
        req.headers["x-company-code"] || req.query.company_code || ""
      ).toLowerCase();
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      // Get PO details
      const [poRows] = await connection.query(
        `SELECT * FROM purchase_orders WHERE id = ?`,
        [poId]
      );

      if (poRows.length === 0)
        return res.status(404).json({ message: "Purchase Order not found" });

      const po = poRows[0];

      // Get PO items
      const [items] = await connection.query(
        `SELECT poi.*, p.product_name, p.hsn_code 
         FROM purchase_order_items poi
         JOIN products p ON poi.product_id = p.id
         WHERE poi.purchase_order_id = ? AND poi.status = 'Active'`,
        [poId]
      );

      // Prepare response
      const response = {
        header: {
          party_type: po.party_type,
          vendor_id: po.vendor_id,
          farmer_id: po.farmer_id,
          vendor_name: po.vendor_name,
          farmer_name: po.farmer_name,
          address: po.address,
          mobile_no: po.mobile_no,
          gst_no: po.gst_no,
          terms_condition: po.terms_condition,
          party_balance: po.party_balance || 0,
          party_min_balance: po.party_min_balance || 0,
        },
        items: items.map((item) => ({
          po_item_id: item.id,
          product_id: item.product_id,
          item_name: item.product_name,
          hsn_code: item.hsn_code,
          pending_qty: item.quantity - (item.received_qty || 0),
          qty: item.quantity,
          rate: item.rate,
          discount_rate: item.discount_rate || 0,
          gst_percent: item.gst_percent || 0,
          unit: item.unit || "kg",
        })),
      };

      res.json(response);
    } catch (err) {
      console.error("Get PO for purchase error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Delete purchase
  delete: async (req, res) => {
    const connection = db.promise();
    try {
      const { id } = req.params;
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      await connection.query("START TRANSACTION");

      // Get items to revert stock
      const [items] = await connection.query(
        `SELECT product_id, size, unit FROM \`${itemsTable}\` WHERE purchase_id = ?`,
        [id]
      );

      // Revert stock for each item
      for (const item of items) {
        const decGrams = convertToGramsBackend(-item.size, item.unit || "kg");
        const [prodRows] = await connection.query(
          `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
          [item.product_id]
        );

        if (prodRows.length) {
          const curr = Number(prodRows[0].size || 0);
          const updated = curr + decGrams; // Subtract from current stock

          if (updated < 0) {
            await connection.query("ROLLBACK");
            return res.status(400).json({
              error: `Cannot delete: stock would go negative for product ${item.product_id}`,
            });
          }

          await connection.query(`UPDATE products SET size = ? WHERE id = ?`, [
            updated,
            item.product_id,
          ]);
        }
      }

      // Delete items
      await connection.query(
        `DELETE FROM \`${itemsTable}\` WHERE purchase_id = ?`,
        [id]
      );

      // Delete purchase
      await connection.query(`DELETE FROM \`${purchasesTable}\` WHERE id = ?`, [
        id,
      ]);

      await connection.query("COMMIT");
      res.json({ message: "Purchase deleted successfully" });
    } catch (err) {
      try {
        await connection.query("ROLLBACK");
      } catch {}
      console.error("Purchase delete error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = purchaseController;
