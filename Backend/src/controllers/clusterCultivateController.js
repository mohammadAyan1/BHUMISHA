const pool = require("../config/db");

const clusterCultivateController = {
  create: async (req, res) => {
    try {
      const {
        clusterName, // clusterId
        farmerName, // farmerId
        farmName, // farmId
        productName, // product
        size,
        startDate,
        endDate,
      } = req.body;

      console.log(req.body, "QWERTYUIOP");

      const sql = `
        INSERT INTO cluster_cultivate_products 
        (clusterId, farmerId, farmId, product, size, start_date, end_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      pool.query(
        sql,
        [
          clusterName,
          farmerName,
          farmName,
          productName,
          size,
          startDate,
          endDate,
        ],
        (err, result) => {
          if (err) {
            console.error("Cultivation Insert Error:", err);
            return res.status(500).json({
              success: false,
              message: "Error while creating cultivated product",
              error: err.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Cultivated product created successfully",
            data: result,
          });
        }
      );
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while creating cultivated product",
        error: error.message,
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const sql = `
  SELECT 
    ccp.*, 
    cc.cluster_location, 
    cc.cluster_manager,
    cc.district AS cluster_district, 
    cc.state AS cluster_state, 
    cc.city AS cluster_city,
    cc.state AS company_cluster_state,

    ff.location AS farm_location,
    ff.district AS farmer_farm_district,
    ff.size AS farm_size,
    ff.farm_type,
    ff.state AS farmer_farm_state,

    f.name AS farmer_name, 
    f.father_name, 
    f.contact_number,
    f.district AS farmer_district,
    f.state AS farmer_state

  FROM cluster_cultivate_products ccp

  LEFT JOIN company_clusters cc 
    ON ccp.clusterId = cc.id

  LEFT JOIN farmer_farm ff
    ON ccp.farmId = ff.id

  LEFT JOIN farmers f
    ON ccp.farmerId = f.id

  WHERE ccp.status = 'Active' 
    AND ccp.is_delete = 'false'

  ORDER BY ccp.id DESC;
`;

      pool.query(sql, (err, result) => {
        if (err) {
          console.error("Fetch Error:", err);
          return res.status(500).json({
            success: false,
            message: "Error while fetching cultivated products",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Cultivated products fetched successfully",
          data: result,
        });
      });
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching cultivated products",
        error: error.message,
      });
    }
  },

  //   getAllInactiveCultivate: async (req, res) => {
  //     try {
  //       const sql = `
  //         SELECT * FROM cluster_farmer_products
  //         WHERE status = 'Inactive' AND is_delete = 'false'
  //       `;

  //       pool.query(sql, (err, result) => {
  //         if (err) {
  //           console.error("Fetch Error:", err);
  //           return res.status(500).json({
  //             success: false,
  //             message: "Error while fetching cultivated products",
  //             error: err.message,
  //           });
  //         }

  //         return res.status(200).json({
  //           success: true,
  //           message: "Cultivated products fetched successfully",
  //           data: result,
  //         });
  //       });
  //     } catch (error) {
  //       console.error("Server Error:", error);
  //       return res.status(500).json({
  //         success: false,
  //         message: "Server error while fetching cultivated products",
  //         error: error.message,
  //       });
  //     }
  //   },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const sql = `
        UPDATE cluster_cultivate_products 
        SET is_delete = 'true', status = 'Inactive' 
        WHERE id = ?
      `;

      pool.query(sql, [id], (err, result) => {
        if (err) {
          console.error("Delete Error:", err);
          return res.status(500).json({
            success: false,
            message: "Error while deleting cultivated product",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Cultivated product deleted successfully",
          data: result,
        });
      });
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while deleting cultivated product",
        error: error.message,
      });
    }
  },
};

module.exports = clusterCultivateController;
