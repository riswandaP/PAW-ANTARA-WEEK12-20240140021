const { Op } = require("sequelize");
const Entry = require("../models/entry.model");

async function showHome(req, res) {
  const entries = await Entry.findAll({ order: [["createdAt", "DESC"]] });
  res.render("index", {
    entries,
    errors: req.flash("errors"),
    old: req.flash("old")[0] || {},
    q: null,
  });
}

async function createEntry(req, res) {
  const { nama, email, pesan } = req.body;
  await Entry.create({ nama, email, pesan });
  req.flash("success", "Pesan berhasil dikirim!");
  res.redirect("/");
}

async function searchEntry(req, res) {
  const q = req.query.q || "";

  // AMAN: parameterized query lewat Sequelize Op.iLike,
  // bukan string SQL yang disambung manual dari req.query.q
  const entries = await Entry.findAll({
    where: {
      [Op.or]: [
        { nama: { [Op.iLike]: `%${q}%` } },
        { pesan: { [Op.iLike]: `%${q}%` } },
      ],
    },
    order: [["createdAt", "DESC"]],
  });

  res.render("index", {
    entries,
    errors: [],
    old: {},
    q,
  });
}

module.exports = { showHome, createEntry, searchEntry };