const express = require("express");
const farmRoutes = express.Router();
const farmController = require("../controllers/farm.controller");

// Get all retail sales bills with items

farmRoutes.get("/", farmController.getAllFarm);

farmRoutes.post("/", farmController.createFarm);

module.exports = farmRoutes;
