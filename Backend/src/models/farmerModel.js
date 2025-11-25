const db = require("../config/db");

// Create
const createFarmer = (farmerData, bankData, callback) => {
  const farmerQuery = `
    INSERT INTO farmers
      (name, father_name, district, tehsil, patwari_halka, village, contact_number, khasara_number, status, balance, min_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, DEFAULT(balance)), COALESCE(?, DEFAULT(min_balance)))
  `;
  db.query(
    farmerQuery,
    [
      farmerData.name,
      farmerData.father_name,
      farmerData.district,
      farmerData.tehsil,
      farmerData.patwari_halka,
      farmerData.village,
      farmerData.contact_number,
      farmerData.khasara_number,
      farmerData.status || "Active",
      farmerData.balance, // undefined => DEFAULT via COALESCE
      farmerData.min_balance, // undefined => DEFAULT via COALESCE
    ],
    (err, result) => {
      if (err) return callback(err);

      const farmer_id = result.insertId;
      const safeBank = {
        pan_number: (bankData && bankData.pan_number) || "",
        account_holder_name: (bankData && bankData.account_holder_name) || "",
        bank_name: (bankData && bankData.bank_name) || "",
        account_number: (bankData && bankData.account_number) || "",
        ifsc_code: (bankData && bankData.ifsc_code) || "",
        branch_name: (bankData && bankData.branch_name) || "",
      };

      const bankQuery = `
        INSERT INTO farmer_bank_details
        (farmer_id, pan_number, account_holder_name, bank_name, account_number, ifsc_code, branch_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        bankQuery,
        [
          farmer_id,
          safeBank.pan_number,
          safeBank.account_holder_name,
          safeBank.bank_name,
          safeBank.account_number,
          safeBank.ifsc_code,
          safeBank.branch_name,
        ],
        callback
      );
    }
  );
};

// Read
const getFarmers = (callback) => {
  const query = `
    SELECT f.id, f.name, f.father_name, f.district, f.tehsil, f.patwari_halka, f.village,
           f.contact_number, f.khasara_number, f.status,
           f.balance, f.min_balance,
           b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
    FROM farmers f
    LEFT JOIN farmer_bank_details b ON f.id = b.farmer_id
  `;
  db.query(query, callback);
};

// Update
const updateFarmer = (farmer_id, farmerData, bankData, callback) => {
  const farmerQuery = `
  UPDATE farmers
  SET name=?, father_name=?, district=?, tehsil=?, patwari_halka=?, village=?, contact_number=?, khasara_number=?,
      status=COALESCE(?, status),
      balance=COALESCE(?, balance),
      min_balance=COALESCE(?, min_balance)
  WHERE id=?
`;
  db.query(
    farmerQuery,
    [
      farmerData.name,
      farmerData.father_name,
      farmerData.district,
      farmerData.tehsil,
      farmerData.patwari_halka,
      farmerData.village,
      farmerData.contact_number,
      farmerData.khasara_number,
      // status: allow undefined to keep existing
      farmerData.status,
      farmerData.balance,
      farmerData.min_balance,
      farmer_id,
    ]
    // ...
  );
};

// Delete
const deleteFarmer = (farmer_id, callback) => {
  db.query("DELETE FROM farmers WHERE id=?", [farmer_id], callback);
};

// Status
const updateFarmerStatus = (farmer_id, status, callback) => {
  db.query(
    "UPDATE farmers SET status=? WHERE id=?",
    [status, farmer_id],
    callback
  );
};

// Statement
const getFarmerStatement = (
  { farmerId, from, to, limit, offset, sort },
  callback
) => {
  // First get opening balance as of 'from' date
  const openingSql = `
    SELECT
      COALESCE((
        (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date < ?) -
        (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date < ?)
      ), 0) AS opening_balance
  `;

  db.query(
    openingSql,
    [farmerId, from, farmerId, from],
    (err, openingResult) => {
      if (err) return callback(err);

      const openingBalance = openingResult[0]?.opening_balance || 0;

      // Now get transactions with running balance starting from opening balance
      const sql = `
      SELECT
        DATE_FORMAT(t.tx_datetime, '%Y-%m-%d %H:%i:%s') AS tx_datetime,
        t.tx_type,
        t.ref_no,
        t.amount,
        t.net_effect,
        t.running_balance,
        t.payment_method,
        t.note
      FROM (
        -- Sales transactions
        SELECT
          s.bill_date AS tx_datetime,
          'Sale' AS tx_type,
          CONCAT('INV-', s.id) AS ref_no,
          s.total_amount AS amount,
          s.total_amount AS net_effect,
          @running_balance := @running_balance + s.total_amount AS running_balance,
          NULL AS payment_method,
          CONCAT('Sale Invoice #', s.id) AS note
        FROM sales s
        WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date BETWEEN ? AND ?
        UNION ALL
        -- Payment transactions
        SELECT
          p.payment_date AS tx_datetime,
          'Payment' AS tx_type,
          CONCAT('PAY-', p.id) AS ref_no,
          p.amount,
          -p.amount AS net_effect,
          @running_balance := @running_balance - p.amount AS running_balance,
          p.method AS payment_method,
          p.remarks AS note
        FROM sale_payments p
        WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date BETWEEN ? AND ?
      ) t
      ORDER BY t.tx_datetime ${sort === "desc" ? "DESC" : "ASC"}
      LIMIT ? OFFSET ?
    `;

      // Initialize running balance variable with opening balance
      db.query(`SET @running_balance = ${openingBalance}`, (err) => {
        if (err) return callback(err);

        db.query(
          sql,
          [farmerId, from, to, farmerId, from, to, limit, offset],
          (err, rows) => {
            if (err) return callback(err);

            // Get totals
            const totalsSql = `
          SELECT
            (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_invoiced,
            (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?) AS total_paid,
            ((SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) -
             (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?)) AS outstanding_balance
        `;

            db.query(
              totalsSql,
              [farmerId, to, farmerId, to, farmerId, to, farmerId, to],
              (err2, totals) => {
                if (err2) return callback(err2);
                callback(null, {
                  rows,
                  totals:
                    { ...totals[0], opening_balance: openingBalance } || {},
                });
              }
            );
          }
        );
      });
    }
  );
};

module.exports = {
  createFarmer,
  getFarmers,
  updateFarmer,
  deleteFarmer,
  updateFarmerStatus,
  getFarmerStatement,
};
