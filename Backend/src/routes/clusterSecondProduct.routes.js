const express = require("express");
const secondClusterProducts = require("../controllers/ClusterSecondController");

const clusterSecondRoutes = express.Router();

clusterSecondRoutes.post("/", secondClusterProducts.create);
clusterSecondRoutes.get("/", secondClusterProducts.getAll);

module.exports = clusterSecondRoutes;
