const pool = require("../config/db");

const clusterInvetoryController = {
  //   getClusterInventory: (req, res) => {
  //     const sql = `SELECT * FROM cluster_inventory`;
  //     pool.query(sql, (err, result) => {
  //       if (err) {
  //         console.error("Error fetching cluster inventory:", err);
  //         return res.status(500).json({ success: false, error: err.message });
  //       }
  //       res.json({ success: true, data: result });
  //     });
  //   },

  getClusterInventory: (req, res) => {
    const sql = `
    SELECT 
      ci.id,
      ci.qty,
      ci.purchase_rate,
      ci.sale_rate,
      ci.unit,
      ci.entry_date,
      ci.created_at,
      ci.updated_at,
      
      -- Product info
      p.id AS product_id,
      p.name AS product_name,
      p.hsn_number AS product_hsn,
      p.purchase_rate AS product_purchase_rate,
      p.sale_rate AS product_sale_rate,
      
      -- Cluster info
      c.id AS cluster_id,
      c.cluster_location,
      c.cluster_manager,
      c.state AS cluster_state,
      c.city AS cluster_city

    FROM cluster_inventory ci
    LEFT JOIN cluster_second_products p 
      ON ci.cluster_product_id = p.id
    LEFT JOIN company_clusters c
      ON ci.cluster_id = c.id
    ORDER BY ci.id DESC
  `;

    pool.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching cluster inventory:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: result });
    });
  },

  createClusterInventory: (req, res) => {
    const { productId, clusterId, qty, purchase, sale, date, unit } = req.body;

    if (!productId || !clusterId || !qty || !unit) {
      return res
        .status(400)
        .json({ success: false, error: "Required fields missing" });
    }

    // First, check if the product + cluster already exists
    const checkSql = `
    SELECT * FROM cluster_inventory 
    WHERE cluster_product_id = ? AND cluster_id = ?
  `;
    pool.query(checkSql, [productId, clusterId], (err, results) => {
      if (err) {
        console.error("Error checking existing inventory:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (results.length > 0) {
        // Exists, so update quantity, purchase_rate, sale_rate, entry_date
        const existing = results[0];
        const newQty = parseFloat(existing.qty) + parseFloat(qty);
        const updateSql = `
        UPDATE cluster_inventory
        SET qty = ?, 
            purchase_rate = ?, 
            sale_rate = ?, 
            unit = ?, 
            entry_date = ?
        WHERE cluster_product_id = ? AND cluster_id = ?
      `;
        pool.query(
          updateSql,
          [
            newQty,
            purchase || existing.purchase_rate,
            sale || existing.sale_rate,
            unit,
            date || existing.entry_date,
            productId,
            clusterId,
          ],
          (err, result) => {
            if (err) {
              console.error("Error updating inventory:", err);
              return res
                .status(500)
                .json({ success: false, error: err.message });
            }
            return res.json({
              success: true,
              message: "Inventory updated successfully",
            });
          }
        );
      } else {
        // Not exists, insert new row
        const insertSql = `
        INSERT INTO cluster_inventory 
          (cluster_product_id, cluster_id, qty, purchase_rate, sale_rate, unit, entry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        pool.query(
          insertSql,
          [productId, clusterId, qty, purchase, sale, unit, date],
          (err, result) => {
            if (err) {
              console.error("Error creating inventory:", err);
              return res
                .status(500)
                .json({ success: false, error: err.message });
            }
            return res.json({
              success: true,
              message: "Inventory added successfully",
            });
          }
        );
      }
    });
  },
};

module.exports = clusterInvetoryController;
