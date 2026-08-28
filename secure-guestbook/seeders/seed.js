const sequelize = require("../config/database");
const Entry = require("../models/entry.model");

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");
    await sequelize.sync();

    await Entry.create({
      nama: "Wanda",
      email: "wanda@example.com",
      pesan: "Halo, ini pesan pertama di buku tamu!",
    });

    await Entry.create({
      nama: "Percobaan XSS",
      email: "test@example.com",
      pesan: "<script>alert('XSS berhasil jika ini muncul jadi alert')</script>",
    });

    console.log("Seeding selesai");
    process.exit(0);
  } catch (err) {
    console.error("Gagal seeding:", err.message);
    process.exit(1);
  }
}

seed();