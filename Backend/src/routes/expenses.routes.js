const express = require("express");
const AllExpensesRoutes = express.Router();
const AllExpensesController = require("../controllers/expenses.controller");

// Get all retail sales bills with items

AllExpensesRoutes.get("/", AllExpensesController.getAllExpenses);
AllExpensesRoutes.post("/create", AllExpensesController.createExpenses);

module.exports = AllExpensesRoutes;
