const db = require("../config/db");



const createVendor = (vendorData, bankData, callback) => {
  // Use DB defaults if undefined by passing DEFAULT keyword
  const vendorQuery = `
    INSERT INTO vendors
      (vendor_name, firm_name, gst_no, address, contact_number, status, balance, min_balance)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, DEFAULT(balance)), COALESCE(?, DEFAULT(min_balance)))
  `;
  db.query(
    vendorQuery,
    [
      vendorData.vendor_name,
      vendorData.firm_name,
      vendorData.gst_no,
      vendorData.address,
      vendorData.contact_number,
      vendorData.status || "active",
      vendorData.balance,        // if undefined -> DEFAULT via COALESCE
      vendorData.min_balance     // if undefined -> DEFAULT via COALESCE
    ],
    (err, result) => {
      if (err) return callback(err);
      const vendor_id = result.insertId;

      const safeBank = {
        pan_number: bankData?.pan_number || "",
        account_holder_name: bankData?.account_holder_name || "",
        bank_name: bankData?.bank_name || "",
        account_number: bankData?.account_number || "",
        ifsc_code: bankData?.ifsc_code || "",
        branch_name: bankData?.branch_name || "",
      };

      const bankQuery = `
        INSERT INTO vendor_bank_details
          (vendor_id, pan_number, account_holder_name, bank_name, account_number, ifsc_code, branch_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        bankQuery,
        [
          vendor_id,
          safeBank.pan_number,
          safeBank.account_holder_name,
          safeBank.bank_name,
          safeBank.account_number,
          safeBank.ifsc_code,
          safeBank.branch_name,
        ],
        (err2) => {
          if (err2) return callback(null, { insertId: vendor_id });
          callback(null, { insertId: vendor_id });
        }
      );
    }
  );
};



// ================= Get Vendors =================
const getVendors = (callback) => {
  const query = `
    SELECT
      v.id, v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number, v.status,
      v.balance, v.min_balance,
      v.created_at,
      b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
    FROM vendors v
    LEFT JOIN vendor_bank_details b ON v.id = b.vendor_id
  `;
  db.query(query, callback);
};

// ================= Update Vendor =================
const updateVendor = (vendor_id, vendorData, bankData, callback) => {
  const vendorQuery = `
    UPDATE vendors
    SET vendor_name=?, firm_name=?, gst_no=?, address=?, contact_number=?, status=?,
        balance=COALESCE(?, balance),
        min_balance=COALESCE(?, min_balance)
    WHERE id=?
  `;
  db.query(
    vendorQuery,
    [
      vendorData.vendor_name,
      vendorData.firm_name,
      vendorData.gst_no,
      vendorData.address,
      vendorData.contact_number,
      vendorData.status,
      vendorData.balance,
      vendorData.min_balance,
      vendor_id,
    ],
    (err) => {
      if (err) return callback(err);

      const safeBank = {
        pan_number: bankData?.pan_number || "",
        account_holder_name: bankData?.account_holder_name || "",
        bank_name: bankData?.bank_name || "",
        account_number: bankData?.account_number || "",
        ifsc_code: bankData?.ifsc_code || "",
        branch_name: bankData?.branch_name || "",
      };

      const bankQuery = `
        UPDATE vendor_bank_details
        SET pan_number=?, account_holder_name=?, bank_name=?, account_number=?, ifsc_code=?, branch_name=?
        WHERE vendor_id=?
      `;
      db.query(
        bankQuery,
        [
          safeBank.pan_number,
          safeBank.account_holder_name,
          safeBank.bank_name,
          safeBank.account_number,
          safeBank.ifsc_code,
          safeBank.branch_name,
          vendor_id,
        ],
        callback
      );
    }
  );
};


// ================= Delete Vendor =================
const deleteVendor = (vendor_id, callback) => {
  const query = "DELETE FROM vendors WHERE id=?";
  db.query(query, [vendor_id], callback);
};

// ================= Update Status Only =================
const updateVendorStatus = (vendor_id, status, callback) => {
  const query = "UPDATE vendors SET status=? WHERE id=?";
  db.query(query, [status, vendor_id], callback);
};


const getVendorById = (vendor_id, callback) => {
  const query = `
    SELECT
      v.id, v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number, v.status,
      v.balance, v.min_balance,
      v.created_at,
      b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
    FROM vendors v
    LEFT JOIN vendor_bank_details b ON v.id = b.vendor_id
    WHERE v.id = ?
  `;
  db.query(query, [vendor_id], callback);
};

// Statement
const getVendorStatement = ({ vendorId, from, to, limit, offset, sort }, callback) => {
  // Opening balance is 0 since no payment tracking for vendors
  const openingBalance = 0;

  // Get transactions (only purchases for vendors)
  const sql = `
    SELECT
      DATE_FORMAT(p.bill_date, '%Y-%m-%d') AS tx_datetime,
      'Purchase' AS tx_type,
      CONCAT('BILL-', p.bill_no) AS ref_no,
      p.total_amount AS amount,
      p.total_amount AS net_effect,
      @running_balance := @running_balance + p.total_amount AS running_balance,
      NULL AS payment_method,
      CONCAT('Purchase Bill #', p.bill_no) AS note
    FROM purchases p
    WHERE p.vendor_id = ? AND p.status = 'Active' AND p.bill_date BETWEEN ? AND ?
    ORDER BY p.bill_date ${sort === 'desc' ? 'DESC' : 'ASC'}
    LIMIT ? OFFSET ?
  `;

  // Initialize running balance variable with opening balance
  db.query(`SET @running_balance = ${openingBalance}`, (err) => {
    if (err) return callback(err);

    db.query(sql, [vendorId, from, to, limit, offset], (err, rows) => {
      if (err) return callback(err);

      // Get totals
      const totalsSql = `
        SELECT
          (SELECT COALESCE(SUM(p.total_amount), 0) FROM purchases p WHERE p.vendor_id = ? AND p.status = 'Active' AND p.bill_date <= ?) AS total_invoiced,
          0 AS total_paid,
          (SELECT COALESCE(SUM(p.total_amount), 0) FROM purchases p WHERE p.vendor_id = ? AND p.status = 'Active' AND p.bill_date <= ?) AS outstanding_balance
      `;

      db.query(totalsSql, [vendorId, to, vendorId, to], (err2, totals) => {
        if (err2) return callback(err2);
        callback(null, { rows, totals: { ...totals[0], opening_balance: openingBalance } || {} });
      });
    });
  });
};

module.exports = {
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
  getVendorById,
  getVendorStatement
};
