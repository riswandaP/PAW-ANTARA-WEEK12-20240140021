require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const sequelize = require("./config/database");
const entryRoutes = require("./routes/entry.routes");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use("/", entryRoutes);

const PORT = process.env.PORT || 3001;

sequelize
  .authenticate()
  .then(() => {
    console.log("Koneksi database berhasil");
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server jalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Gagal konek ke database:", err.message);
  });