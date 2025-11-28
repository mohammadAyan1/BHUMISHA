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

function editEmployee(req, res) {
  const { id } = req.params; // <-- Make sure id comes from params
  const { name, email, phone, position, base_salary, join_date } = req.body;

  // If a new photo is uploaded use it, else keep old photo
  const photo = req.file ? req.file.filename : null;

  // Convert date only if provided
  let mysqlDate = null;
  if (join_date) {
    mysqlDate = new Date(join_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }

  const sql = `
    UPDATE employees
    SET 
        name = ?,
        email = ?,
        phone = ?,
        position = ?,
        base_salary = ?,
        join_date = ?,
        photo = COALESCE(?, photo)
    WHERE id = ?;
  `;

  pool.query(
    sql,
    [
      name,
      email,
      phone,
      position,
      base_salary,
      mysqlDate,
      photo,
      id, // 👈 FIXED (8th parameter)
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        affectedRows: result.affectedRows,
        message: "Employee updated successfully",
      });
    }
  );
}

function deleteEmployee(req, res) {
  const id = Number(req.params.id); // ensure numeric ID
  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID" });

  const sql = `DELETE FROM employees WHERE id = ?`;

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }

    return res.json({
      success: true,
      affectedRows: result.affectedRows,
      message: "Employee deleted successfully",
    });
  });
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

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee,
  editEmployee,
  deleteEmployee,
};
