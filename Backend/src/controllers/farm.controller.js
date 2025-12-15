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
      ff.district AS farm_district,

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

  getAllFarmSizeByFarmerId: (req, res) => {
    const { id } = req.query;

    const sql = `
    SELECT 
      *
    FROM farmer_farm 
    WHERE farmer_id = ?
  `;

    pool.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Error fetching farms:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      return res.json({ success: true, data: results });
    });
  },

  createFarm: (req, res) => {
    const { farmerId, location, size, type, state, village, district } =
      req.body;

    console.log(req.body);

    const sql = `
      INSERT INTO farmer_farm (farmer_id, location, size, farm_type,state,city,district)
      VALUES (?, ?, ?, ?,?,?,?)
    `;
    pool.query(
      sql,
      [farmerId, location, size, type, state, village, district],
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
