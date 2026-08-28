const express = require("express");
const router = express.Router();
const {
  showHome,
  createEntry,
  searchEntry,
} = require("../controllers/entry.controller");
const {
  entryValidationRules,
  handleValidationErrors,
} = require("../middlewares/validators");

router.get("/", showHome);
router.get("/search", searchEntry);
router.post("/entry", entryValidationRules, handleValidationErrors, createEntry);

module.exports = router;