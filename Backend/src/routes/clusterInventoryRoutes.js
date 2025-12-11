const express = require("express");
const clusterInventoryController = require("../controllers/clusterInventoryController");
const clusterInventoryRoutes = express.Router();

clusterInventoryRoutes.get("/", clusterInventoryController.getClusterInventory);
clusterInventoryRoutes.post(
  "/",
  clusterInventoryController.createClusterInventory
);
// router.put("/:id", clusterInventoryController.updateClusterInventory);
// router.delete("/:id", clusterProductsController.deleteClusterInventory);

module.exports = clusterInventoryRoutes;
