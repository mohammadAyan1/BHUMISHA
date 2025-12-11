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
      const sql = `
      SELECT
        e.id,
        e.expenses_for,
        e.expenses_type,

        CASE
          WHEN e.expenses_for = 'emp' THEN emp.name
          ELSE e.master
        END AS master_name,

        e.amount,
        e.remark,
        e.documents,
        e.expense_date,
        e.expensedate,
        e.incentive,

        c.code,
        c.name

      FROM expenses e
      LEFT JOIN employees emp
        ON e.expenses_for = 'emp' AND e.master = emp.id

      LEFT JOIN companies c
        ON e.company_id = c.id
    `;

      pool.query(sql, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }
        return res.json({ success: true, data: results });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  createExpenses: (req, res) => {
    const {
      amount,
      billNo,
      category,
      empName,
      from,
      expensedate,
      location,
      pnrNo,
      remark,
      subCategory,
      to,
      company_id,
      incentive,
    } = req.body;

    console.log(req.body);

    console.log(company_id, "DFGHJ");

    console.log(expensedate, "this is the date");

    const files = req.files ? req.files.map((file) => file.path) : [];

    console.log(files);

    const locationFromToTo = `${from}-to-${to}`;

    const expenses_for = category;
    const expenses_type = pick(subCategory, locationFromToTo, location);
    const master = pick(empName, billNo, pnrNo);

    const safeIncentive =
      incentive && incentive !== "undefined" ? Number(incentive) : 0;

    const sql = `
  INSERT INTO expenses
  (expenses_for, expenses_type, master, amount, remark, documents, expense_date, company_id, incentive)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    pool.query(
      sql,
      [
        expenses_for,
        expenses_type,
        master,
        amount,
        remark,
        JSON.stringify(files), // convert array of file paths to string
        expensedate,
        Number(company_id),
        safeIncentive,
      ],
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
