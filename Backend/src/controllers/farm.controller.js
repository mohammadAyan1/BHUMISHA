const pool = require("../config/db");

const farmController = {
  getAllFarm: (req, res) => {
    const sql = `
    SELECT 
      ff.id AS farm_id,
      ff.location,
      ff.size,
      ff.farm_type,
      ff.farmer_id,

      f.name,
      f.father_name,
      f.district,
      f.tehsil,
      f.patwari_halka,
      f.village,
      f.contact_number,
      f.khasara_number,
      f.state,
      f.grade
    FROM farmer_farm ff
    LEFT JOIN farmers f ON ff.farmer_id = f.id
    ORDER BY ff.id DESC
  `;

    pool.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching farms:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      return res.json({ success: true, data: results });
    });
  },

  createFarm: (req, res) => {
    const { farmerId, location, size, type, state, village } = req.body;

    console.log(req.body);

    const sql = `
      INSERT INTO farmer_farm (farmer_id, location, size, farm_type,state,city)
      VALUES (?, ?, ?, ?,?,?)
    `;
    pool.query(
      sql,
      [farmerId, location, size, type, state, village],
      (err, results) => {
        if (err) {
          console.error("Error creating farm:", err);
          return res.status(500).json({ success: false, error: err.message });
        }
        return res.json({ success: true, data: results });
      }
    );
  },
};

module.exports = farmController;
