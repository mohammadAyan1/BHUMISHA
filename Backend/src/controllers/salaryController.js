const pool = require("../config/db");
const { calculateSalary } = require("../utils/salaryCalc");

// -------------------------------------------------
// GENERATE SALARY (Callback version)
// -------------------------------------------------
function generateSalary(req, res) {
  const { employee_id, year, month } = req.body;

  // Step 1: Get employee base salary
  pool.query(
    "SELECT base_salary FROM employees WHERE id=?",
    [employee_id],
    (err, empRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (empRows.length === 0)
        return res.status(404).json({ error: "Employee not found" });

      const baseSalary = Number(empRows[0].base_salary);

      // Step 2: Get attendance
      pool.query(
        "SELECT date, status, leave_type, reason FROM attendance WHERE employee_id=? AND YEAR(date)=? AND MONTH(date)=?",
        [employee_id, year, month],
        (err, attRows) => {
          if (err) return res.status(500).json({ error: err.message });

          // Step 3: Get incentives
          pool.query(
            "SELECT IFNULL(SUM(amount),0) AS total FROM incentives WHERE employee_id=? AND year=? AND month=?",
            [employee_id, year, month],
            (err, incRows) => {
              if (err) return res.status(500).json({ error: err.message });

              const incentivesTotal = Number(incRows[0].total || 0);

              // Step 4: Calculate salary
              const result = calculateSalary(
                baseSalary,
                attRows,
                Number(year),
                Number(month),
                incentivesTotal
              );

              // Step 5: Insert or update salary report
              const insertQuery = `
                INSERT INTO salary_reports 
                  (employee_id, year, month, base_salary, days_in_month, total_deduction, total_incentives, final_salary)
                VALUES (?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE
                  base_salary=VALUES(base_salary),
                  days_in_month=VALUES(days_in_month),
                  total_deduction=VALUES(total_deduction),
                  total_incentives=VALUES(total_incentives),
                  final_salary=VALUES(final_salary),
                  generated_at=CURRENT_TIMESTAMP
              `;

              pool.query(
                insertQuery,
                [
                  employee_id,
                  year,
                  month,
                  baseSalary,
                  result.daysInMonth,
                  result.totalDeduction,
                  result.incentivesTotal,
                  result.finalSalary,
                ],
                (err) => {
                  if (err) return res.status(500).json({ error: err.message });

                  res.json({ success: true, result });
                }
              );
            }
          );
        }
      );
    }
  );
}

// -------------------------------------------------
// GET SALARY REPORT (Callback version)
// -------------------------------------------------
// function getSalaryReport(req, res) {
//   const { id } = req.params;
//   const { year, month } = req.query;

//   pool.query(
//     "SELECT * FROM salary_reports WHERE employee_id=? AND year=? AND month=?",
//     [id, year, month],
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: err.message });
//       if (rows.length === 0)
//         return res.status(404).json({ error: "Not generated" });

//       res.json({ success: true, result: rows[0] });
//       // res.json(rows[0]);
//     }
//   );
// }

function getSalaryReport(req, res) {
  const { id } = req.params;
  const { year, month } = req.query;

  // Step 1: Fetch salary report
  pool.query(
    "SELECT * FROM salary_reports WHERE employee_id=? AND year=? AND month=?",
    [id, year, month],

    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0)
        return res.status(404).json({ error: "Not generated" });

      const salary = rows[0];

      // Step 2: Fetch attendance records
      pool.query(
        "SELECT date, status, leave_type, reason FROM attendance WHERE employee_id=? AND YEAR(date)=? AND MONTH(date)=?",
        [id, year, month],

        (err2, attendance) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            success: true,
            result: {
              daysInMonth: salary.days_in_month,
              perDay: Number(salary.base_salary) / salary.days_in_month,
              totalDeduction: Number(salary.total_deduction),
              incentivesTotal: Number(salary.total_incentives),
              finalSalary: Number(salary.final_salary),
              attendanceRecords: attendance,
            },
          });
        }
      );
    }
  );
}

module.exports = { generateSalary, getSalaryReport };
