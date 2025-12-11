const pool = require("../config/db");

const clusterTransactionController = {
  async create(req, res) {
    try {
      console.log(req.body);

      const {
        clusterId,
        farmerId,
        productList,
        productName,
        salesRate,
        purchaseRate,
        type,
        gstper,
        date,
        billno,
        total,
        paid,
        remaining,
        qty,
        unit,
        qtyGram,
        remarks,
      } = req.body;

      console.log(req?.body);

      const sql = `INSERT INTO cluster_transactions 
      (billno,clusterId,date,farmerId,gstper,paid,total,remaining,type,
       productList,productName,purchaseRate,salesRate,qty,unit,remarks)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      pool.query(
        sql,
        [
          billno,
          clusterId,
          date,
          farmerId,
          gstper,
          paid,
          total,
          remaining,
          type,
          JSON.stringify(productList),
          productName,
          purchaseRate,
          salesRate,
          qty,
          unit,
          remarks,
        ],
        async (err, result) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({ error: "Database error", details: err });
          }

          // -----------------------------
          //  INVENTORY UPDATE STARTS HERE
          // -----------------------------

          let qtyUpdateSql = "";
          let qtyValue = 0;

          if (type === "sales") {
            // subtract
            qtyUpdateSql = `
            UPDATE cluster_inventory 
            SET qty = qty - ?, 
                purchase_rate = ?, 
                sale_rate = ?, 
                entry_date = CURRENT_DATE(),
                updated_at = CURRENT_TIMESTAMP()
            WHERE cluster_id = ? AND cluster_product_id = ?
          `;
            qtyValue = qtyGram;
          } else if (type === "purchase") {
            // add
            qtyUpdateSql = `
            UPDATE cluster_inventory 
            SET qty = qty + ?, 
                purchase_rate = ?, 
                sale_rate = ?, 
                entry_date = CURRENT_DATE(),
                updated_at = CURRENT_TIMESTAMP()
            WHERE cluster_id = ? AND cluster_product_id = ?
          `;
            qtyValue = qtyGram;
          }

          if (qtyUpdateSql !== "") {
            pool.query(
              qtyUpdateSql,
              [qtyValue, purchaseRate, salesRate, clusterId, productList?.id],
              (err2, invResult) => {
                if (err2) {
                  console.error("Inventory update error:", err2);
                  return res.status(500).json({
                    message: "Product added but inventory update failed",
                    error: err2,
                  });
                }

                return res.status(201).json({
                  message: "Cluster created & inventory updated",
                  id: result.insertId,
                });
              }
            );
          } else {
            return res.status(201).json({
              message: "Cluster created (no inventory change)",
              id: result.insertId,
            });
          }
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
    }
  },

  async getAllClusterTransaction(req, res) {
    try {
      const sql = `SELECT 
  ci.*,
  cc.cluster_location,
  cc.cluster_manager,
  cc.state AS cluster_state,
  cc.city AS cluster_city,
  f.name AS farmer_name,
  f.father_name,
  f.district,
  f.tehsil,
  f.village,
  f.contact_number
FROM cluster_transactions AS ci
LEFT JOIN company_clusters AS cc
  ON ci.clusterId = cc.id
LEFT JOIN farmers AS f
  ON ci.farmerId = f.id;
`;

      pool.query(sql, (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Database error", details: err });
        }
        res.status(201).json({
          message: "Cluster Get ",
          data: result,
        });
      });
    } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
    }
  },
};

module.exports = clusterTransactionController;
