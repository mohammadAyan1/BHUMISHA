// routes/sales.routes.js
const express = require("express");
const salesRoutes = express.Router();
const SalesController = require("../controllers/sales.controller");

// New bill number
salesRoutes.get("/new-bill-no", SalesController.getNewBillNo);

// CRUD
salesRoutes.post("/", SalesController.createSale);
salesRoutes.get("/", SalesController.getSales);
salesRoutes.get("/:id", SalesController.getSaleByIdWithItems);
salesRoutes.put("/:id", SalesController.updateSale);
salesRoutes.delete("/:id", SalesController.deleteSale);
// Previous due
salesRoutes.get(
  "/party/:type/:id/previous-due",
  SalesController.getPartyPreviousDue
);

// Get SO for sale creation
salesRoutes.get("/from-so/:id", SalesController.getFromSO);

module.exports = salesRoutes;
