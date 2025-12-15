const pool = require("../config/db");

// Get all clusters WITH company details
const getClusters = (req, res) => {
  const sql = `
    SELECT 
      cc.id,
      cc.company_id,
      c.code AS company_code,
      c.name AS company_name,
      c.address AS company_address,
      c.contact_no AS company_contact_no,
      cc.cluster_location,
      cc.cluster_manager,
      cc.district
    FROM company_clusters cc
    LEFT JOIN companies c ON cc.company_id = c.id
    ORDER BY cc.id DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

// Create new cluster
const createCluster = (req, res) => {
  console.log(req?.body);

  const { companyId, location, manager, state, village, district } = req.body;
  const sql =
    "INSERT INTO company_clusters (company_id, cluster_location, cluster_manager,state,city,district) VALUES (?, ?, ?,?,?,?)";
  pool.query(
    sql,
    [companyId, location, manager, state, village, district],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).json({ message: "Cluster created", id: result.insertId });
    }
  );
};
// Update cluster
const updateCluster = (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  const sql = "UPDATE company_clusters SET name = ?, status = ? WHERE id = ?";
  pool.query(sql, [name, status, id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Cluster updated", id, status });
  });
};
// Delete cluster
const deleteCluster = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM company_clusters WHERE id = ?";
  pool.query(sql, [id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Cluster deleted", id });
  });
};
module.exports = {
  getClusters,
  createCluster,
  updateCluster,
  deleteCluster,
};
