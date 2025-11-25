// controllers/sales.controller.js
const Sales = require("../models/sales.model");
const SaleItems = require("../models/saleItems.model");
const { normalize } = require("../services/companyCode");
const Company = require("../models/company.model");
const { generateSoToSaleResponse } = require("../services/convertSoToSale");
const db = require("../config/db");

const SalesController = {
  async createSale(req, res) {
    try {
      // require company code header/body
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const {
        party_type, // 'customer' | 'vendor' | 'farmer'
        customer_id,
        vendor_id,
        farmer_id,
        bill_no,
        bill_date,
        items,
        status = "Active",
        payment_status = "Unpaid",
        payment_method = "Cash",
        remarks = null,
        other_amount = 0,
        other_note = null,
        cash_received = 0,
      } = req.body;

      const buyer_type = req.body.buyer_type?.toLowerCase().replace(/\s+/g, "");

      if (!bill_date || !Array.isArray(items) || !items.length) {
        return res
          .status(400)
          .json({ error: "bill_date and items[] required" });
      }
      if (!["customer", "vendor", "farmer"].includes(party_type)) {
        return res.status(400).json({
          error: "party_type must be 'customer' | 'vendor' | 'farmer'",
        });
      }
      const chosenId =
        party_type === "customer"
          ? customer_id
          : party_type === "vendor"
          ? vendor_id
          : party_type === "farmer"
          ? farmer_id
          : null;
      if (!chosenId) {
        return res.status(400).json({ error: `${party_type}_id is required` });
      }

      const result = await Sales.create(
        {
          party_type,
          customer_id,
          vendor_id,
          farmer_id,
          buyer_type,
          bill_no,
          bill_date,
          status,
          payment_status,
          payment_method,
          remarks,
          other_amount,
          other_note,
          items,
          cash_received: Number(cash_received || 0),
        },
        code
      );

      // If created from a Sales Order, mark that SO as converted with robust fallback
      try {
        const linkedSoId = Number(req.body?.linked_so_id || 0);
        if (linkedSoId) {
          await new Promise((resolve, reject) =>
            db.query(
              `UPDATE sales_orders SET status='Inactive' WHERE id=?`,
              [linkedSoId],
              (e) => (e ? reject(e) : resolve())
            )
          ).catch((e) => {
            if (
              e &&
              (e.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
                e.code === "WARN_DATA_TRUNCATED" ||
                e.errno === 1265 ||
                e.sqlState === "01000")
            ) {
              return new Promise((resolve2, reject2) =>
                db.query(
                  `UPDATE sales_orders SET status='Cancelled' WHERE id=?`,
                  [linkedSoId],
                  (e2) => (e2 ? reject2(e2) : resolve2())
                )
              );
            }
            throw e;
          });
        }
      } catch {}

      return res.status(201).json({
        message: "Sale created successfully",
        id: result.id,
        bill_no: result.bill_no,
        total_taxable: result.total_taxable,
        total_gst: result.total_gst,
        total_amount: result.total_amount,
        previous_due: result.previous_due,
        cash_received: result.cash_received,
        new_due: result.new_due,
        payment_status: result.payment_status,
      });
    } catch (err) {
      console.error("createSale error:", err);
      return res.status(400).json({ error: err.message || "Server Error" });
    }
  },

  async getSales(_req, res) {
    try {
      const code = normalize(
        _req.headers["x-company-code"] || _req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const sales = await Sales.getAll(code);
      return res.json(sales);
    } catch (err) {
      console.error("getSales error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  async getSaleByIdWithItems(req, res) {
    try {
      const sale_id = Number(req.params.id);
      if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });
      const code = normalize(
        req.headers["x-company-code"] || req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const sale = await Sales.getById(sale_id, code);
      if (!sale) return res.status(404).json({ error: "Sale not found" });
      // Attach company details for invoice/logo rendering
      try {
        const company = await Company.getByCode(code);
        if (company) sale.company = company;
      } catch {}
      // items already embedded by model.getById
      return res.json(sale);
    } catch (err) {
      console.error("getSaleByIdWithItems error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  async updateSale(req, res) {
    try {
      const sale_id = Number(req.params.id);
      if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const {
        party_type,
        customer_id,
        vendor_id,
        farmer_id,
        bill_no = null,
        bill_date = null,
        items,
        status,
        payment_status,
        payment_method,
        remarks,
        cash_received = 0, // NEW
      } = req.body;

      if (!bill_date)
        return res.status(400).json({ error: "Bill date is required" });
      if (!["customer", "vendor", "farmer"].includes(party_type)) {
        return res.status(400).json({
          error: "party_type must be 'customer' | 'vendor' | 'farmer'",
        });
      }
      const chosenId =
        party_type === "customer"
          ? customer_id
          : party_type === "vendor"
          ? vendor_id
          : party_type === "farmer"
          ? farmer_id
          : null;
      if (!chosenId)
        return res.status(400).json({ error: `${party_type}_id is required` });

      const result = await Sales.update(
        sale_id,
        {
          party_type,
          customer_id,
          vendor_id,
          farmer_id,
          bill_no,
          bill_date,
          status,
          payment_status,
          payment_method,
          remarks,
          items,
          cash_received: Number(cash_received || 0), // NEW
        },
        code
      );

      return res.json({
        message: "Sale updated successfully",
        total_taxable: result.total_taxable,
        total_gst: result.total_gst,
        total_amount: result.total_amount,
      });
    } catch (err) {
      console.error("updateSale error:", err);
      return res.status(400).json({ error: err.message || "Server Error" });
    }
  },

  async deleteSale(req, res) {
    try {
      const sale_id = Number(req.params.id);
      if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });
      const code = normalize(
        req.headers["x-company-code"] || req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      await Sales.delete(sale_id, code);
      return res.json({ message: "Sale deleted successfully" });
    } catch (err) {
      console.error("deleteSale error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  async getNewBillNo(_req, res) {
    try {
      const code = normalize(
        _req.headers["x-company-code"] || _req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const bill_no = await Sales.getNewBillNo(code);
      return res.json({ bill_no });
    } catch (err) {
      console.error("getNewBillNo error:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Optional: heavy endpoint with embedded items list
  async getPartyPreviousDue(req, res) {
    try {
      const party_type = String(req.params.type || "").toLowerCase();
      const party_id = Number(req.params.id);
      if (!["customer", "vendor", "farmer"].includes(party_type)) {
        return res
          .status(400)
          .json({ error: "type must be 'customer' | 'vendor' | 'farmer'" });
      }
      if (!party_id) return res.status(400).json({ error: "Invalid party id" });

      const conn = await require("../models/sales.model").getConnection();
      try {
        const code = normalize(
          req.headers["x-company-code"] || req.query.company_code || ""
        );
        if (!code)
          return res.status(400).json({ error: "x-company-code required" });
        const { tn } = require("../services/tableName");
        const salesTable = tn(code, "sales");
        const paymentsTable = tn(code, "sale_payments");

        // Ensure per-company payments table exists (idempotent). Template `tpl_sale_payments` should define required columns.
        await conn.execute(
          `CREATE TABLE IF NOT EXISTS \`${paymentsTable}\` LIKE \`tpl_sale_payments\``
        );

        const [[agg]] = await conn.query(
          `
          SELECT
            COALESCE((
              SELECT SUM(s.total_amount)
              FROM \`${salesTable}\` s
              WHERE s.${party_type}_id = ? AND (s.status IS NULL OR s.status <> 'Cancelled')
            ), 0) AS total_sales,
            COALESCE((
              SELECT SUM(p.amount)
              FROM \`${paymentsTable}\` p
              WHERE p.party_type = ? AND p.${party_type}_id = ?
            ), 0) AS total_payments
          `,
          [party_id, party_type, party_id]
        );
        const total_sales = Number(agg?.total_sales || 0);
        const total_payments = Number(agg?.total_payments || 0);
        const previous_due = Math.max(total_sales - total_payments, 0);
        return res.json({ previous_due, total_sales, total_payments });
      } finally {
        await conn.end();
      }
    } catch (err) {
      console.error("getPartyPreviousDue error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  // Get Sales Order Items for creating Sale
  async getFromSO(req, res) {
    try {
      const soId = req.params.id;
      const code = normalize(
        req.headers["x-company-code"] || req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const { tn } = require("../services/tableName");
      const soTable = tn(code, "sales_orders");
      const soItemsTable = tn(code, "sales_order_items");

      const conn = await require("../models/sales.model").getConnection();
      try {
        // Get SO header
        const [[soHeader]] = await conn.query(
          `SELECT * FROM \`${soTable}\` WHERE id = ?`,
          [soId]
        );

        if (!soHeader) {
          return res.status(404).json({ error: "Sales Order not found" });
        }

        // Get SO items
        const [soItems] = await conn.query(
          `SELECT * FROM \`${soItemsTable}\` WHERE so_id = ?`,
          [soId]
        );

        // Format response
        const response = generateSoToSaleResponse(soHeader, soItems);

        res.json(response);
      } finally {
        await conn.end();
      }
    } catch (err) {
      console.error("getFromSO error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = SalesController;
