const mongoose = require("mongoose");

const prayerSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  announcementChannelId: { type: String, required: true },
  prayerRoleId: { type: String, required: true },
});

module.exports = mongoose.model("PrayerSettings", prayerSchema);
