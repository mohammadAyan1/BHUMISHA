const pool = require("../config/db");

// helper: pick first non-empty value
const pick = (...values) => {
  return values.find(
    (v) => v !== undefined && v !== null && v !== "" && v !== "-to-"
  );
};

const allExpenses = {
  getAllExpenses: (req, res) => {
    try {
    } catch (error) {}
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

    const locationFromToTo = `${from}-to-${to}`;

    const expenses_for = category;
    const expenses_type = pick(subCategory, locationFromToTo, location);
    const master = pick(empName, billNo, pnrNo);

    const sql = `
      INSERT INTO expenses
      (expenses_for, expenses_type, master, amount, remark)
      VALUES (?, ?, ?, ?, ?)
    `;

    pool.query(
      sql,
      [expenses_for, expenses_type, master, amount, remark],
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
