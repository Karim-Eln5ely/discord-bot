const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  reason: { type: String, default: "No reason provided" },
  by: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Warning", warningSchema, "warnings");
