const express = require("express");
const authRoutes = require("./auth.routes");
const financeRoutes = require("../modules/finance-emission/finance.routes");
const healthRoutes = require("./health.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/finance-emission", financeRoutes);

module.exports = router;
