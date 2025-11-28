const pool = require("../config/db");

// helper: pick first non-empty value
const pick = (...values) => {
  return values.find(
    (v) => v !== undefined && v !== null && v !== "" && v !== "-to-"
  );
};

const allExpenses = {
  // getAllExpenses: (req, res) => {
  //   try {
  //     const sql = `
  //     SELECT
  //       e.id,
  //       e.expenses_for,
  //       e.expenses_type,
  //       CASE
  //         WHEN e.expenses_for = 'emp' THEN emp.name
  //         ELSE e.master
  //       END AS master_name,
  //       e.amount,
  //       e.remark,
  //       e.documents
  //     FROM expenses e
  //     LEFT JOIN employees emp
  //       ON e.expenses_for = 'emp' AND e.master = emp.id
  //   `;

  //     pool.query(sql, (err, results) => {
  //       if (err) {
  //         console.error(err);
  //         return res.status(500).json({ success: false, error: err.message });
  //       }
  //       return res.json({ success: true, data: results });
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ success: false, error: error.message });
  //   }
  // },

  getAllExpenses: (req, res) => {
    try {
      const sql = `SELECT * FROM expenses`;
      pool.query(sql, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: result });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  createExpenses: (req, res) => {
    const {
      amount,
      billNo,
      category,
      empName,
      from,
      location,
      pnrNo,
      remark,
      subCategory,
      to,
    } = req.body;

    const files = req.files ? req.files.map((file) => file.path) : [];

    console.log(files);

    const locationFromToTo = `${from}-to-${to}`;

    const expenses_for = category;
    const expenses_type = pick(subCategory, locationFromToTo, location);
    const master = pick(empName, billNo, pnrNo);

    const sql = `
      INSERT INTO expenses
      (expenses_for, expenses_type, master, amount, remark,documents)
      VALUES (?, ?, ?, ?, ?,?)
    `;

    pool.query(
      sql,
      [expenses_for, expenses_type, master, amount, remark, files],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: result.insertId });
      }
    );
  },
};

module.exports = allExpenses;
