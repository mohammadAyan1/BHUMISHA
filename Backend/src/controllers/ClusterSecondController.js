const pool = require("../config/db");

const secondClusterProducts = {
  async create(req, res) {
    try {
      const { name, hsn, rate, sale } = req.body;
      console.log(req.body);

      const sql = `
        INSERT INTO cluster_second_products 
        (name, hsn_number, sale_rate, purchase_rate)
        VALUES (?, ?, ?, ?)
      `;

      pool.query(sql, [name, hsn, sale, rate], (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Database error", details: err });
        }

        res.status(201).json({
          message: "Cluster created",
          id: result.insertId,
        });
      });
    } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
    }
  },
  async getAll(req, res) {
    try {
      const sql = `SELECT * FROM cluster_second_products`;

      pool.query(sql, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Database error",
            details: err,
          });
        }

        res.status(200).json({
          message: "Cluster Second Products Retrieved Successfully",
          data: result,
        });
      });
    } catch (error) {
      res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  },
};

module.exports = secondClusterProducts;
