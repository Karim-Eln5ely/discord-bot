require("dotenv").config();
const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const connectDB = require("./db/connection");

// إنشاء البوت مع جميع الـ Intents المطلوبة
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // مهم للـ Voice Logs
  ],
});

// الاتصال بقاعدة البيانات
connectDB();

// إنشاء Collection للأوامر
client.commands = new Collection();

// ===== Load Commands =====
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

// ===== Load Events =====
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

// ===== Handle uncaught errors =====
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// ===== Login the bot =====
client.login(process.env.TOKEN).then(() => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});
