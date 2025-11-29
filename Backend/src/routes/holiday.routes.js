const express = require("express");
const AllHolidayController = require("../controllers/holiday.controller");
const AllHolidayRoutes = express.Router();

AllHolidayRoutes.get("/", AllHolidayController.getAllHoliday);
AllHolidayRoutes.post("/", AllHolidayController.createHoliday);

module.exports = AllHolidayRoutes;
