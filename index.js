require("dotenv").config();
require("./server");
const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const connectDB = require("./db/connection");
const prayerUtils = require("./utils/prayerUtils");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

connectDB();

client.commands = new Collection();
client.activeMoveSpams = new Map();
const commandFolders = fs.readdirSync("./commands");
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`⚠️ Skipped loading ${file} as command (no data.name found)`);
    }
  }
}

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  prayerUtils(client);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

client.login(process.env.TOKEN).then(() => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});
