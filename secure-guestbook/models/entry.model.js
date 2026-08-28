const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Entry = sequelize.define("Entry", {
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pesan: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = Entry;