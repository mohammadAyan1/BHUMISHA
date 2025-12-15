const express = require("express");
const clusterCultivateController = require("../controllers/clusterCultivateController");

const clusterCultivateRoutes = express.Router();

clusterCultivateRoutes.post("/", clusterCultivateController.create);
clusterCultivateRoutes.get("/", clusterCultivateController.getAll);
clusterCultivateRoutes.put("/:id", clusterCultivateController.delete);

module.exports = clusterCultivateRoutes;
