const express = require("express");
const { ok } = require("../config/response");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(
    ok({
      service: "finance-emission-api",
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = router;
