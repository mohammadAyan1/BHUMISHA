const express = require("express");
const AllExpensesRoutes = express.Router();
const AllExpensesController = require("../controllers/expenses.controller");
const upload = require("../middlewares/multer.middleware.expenses");

// Get all retail sales bills with items

AllExpensesRoutes.get("/", AllExpensesController.getAllExpenses);

AllExpensesRoutes.post(
  "/create",
  upload.array("files"),
  AllExpensesController.createExpenses
);

module.exports = AllExpensesRoutes;
