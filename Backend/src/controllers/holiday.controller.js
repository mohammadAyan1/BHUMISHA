const db = require("../config/db");

const AllHolidayController = {
  createHoliday: (req, res) => {
    const { holidayDate, holidayRemark } = req.body;

    const sql = `INSERT INTO holidays (holiday_date, remark) 
    VALUES (?,?)
`;

    db.query(sql, [holidayDate, holidayRemark], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.json({
        success: true,
        id: result.insertId,
      });
    });
  },
  getAllHoliday: (req, res) => {
    const sql = `SELECT id, holiday_date, remark FROM holidays`;
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.json(result); // <-- returns pure array
    });
  },
};

module.exports = AllHolidayController;
