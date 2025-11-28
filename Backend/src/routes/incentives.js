const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/incentivesController");

router.post("/create", ctrl.createIncentive);
router.get("/employee/:id", ctrl.getIncentivesForEmployee);

module.exports = router;
