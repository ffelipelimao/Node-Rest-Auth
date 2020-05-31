const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.js");

router.use(authMiddleware);

router.get("/", (req, res) => {
  res.send({ response: "its works", user: req.userId });
});

module.exports = (app) => app.use("/project", router);
