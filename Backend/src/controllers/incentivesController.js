const pool = require("../config/db");

// -------------------------------------------------
// CREATE INCENTIVE (Callback version)
// -------------------------------------------------
function createIncentive(req, res) {
  const { employee_id, year, month, amount, remark } = req.body;

  const query = `
    INSERT INTO incentives (employee_id, year, month, amount, reason) 
    VALUES (?,?,?,?,?)
  `;

  pool.query(
    query,
    [employee_id, year, month, amount, remark],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.json({
        success: true,
        id: result.insertId,
      });
    }
  );
}

// -------------------------------------------------
// GET INCENTIVES FOR EMPLOYEE (Callback version)
// -------------------------------------------------
function getIncentivesForEmployee(req, res) {
  const { id } = req.params;
  const { year, month } = req.query;

  const query = `
    SELECT * FROM incentives 
    WHERE employee_id = ? AND year = ? AND month = ?
  `;

  pool.query(query, [id, year, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    return res.json(rows);
  });
}

module.exports = { createIncentive, getIncentivesForEmployee };
