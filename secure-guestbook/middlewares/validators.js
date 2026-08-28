const { body, validationResult } = require("express-validator");

const entryValidationRules = [
  body("nama")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama harus 3-50 karakter")
    .escape(),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Format email gak valid")
    .normalizeEmail(),
  body("pesan")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Pesan harus 5-500 karakter")
    .escape(),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "errors",
      errors.array().map((e) => e.msg)
    );
    req.flash("old", req.body);
    return res.redirect("/");
  }
  next();
}

module.exports = { entryValidationRules, handleValidationErrors };