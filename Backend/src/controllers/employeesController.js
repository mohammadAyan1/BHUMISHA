const pool = require("../config/db");

function createEmployee(req, res) {
  const { name, email, phone, position, base_salary, join_date } = req.body;
  const photo = req.file ? req.file.filename : null;

  const mysqlDate = new Date(join_date)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const sql = `
    INSERT INTO employees 
    (name, email, phone, position, base_salary, join_date, photo) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    sql,
    [name, email, phone, position, base_salary, mysqlDate, photo],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
}

function getAllEmployees(req, res) {
  pool.query("SELECT * FROM employees ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
}

function getEmployee(req, res) {
  const { id } = req.params;

  pool.query("SELECT * FROM employees WHERE id = ?", [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    res.json(rows[0]);
  });
}

module.exports = { createEmployee, getAllEmployees, getEmployee };
