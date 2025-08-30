require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

const commands = [];

// نقرأ كل الأوامر من فولدر commands
const commandFolders = fs.readdirSync("./commands");
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] الأمر في ${file} ناقص data أو execute`);
    }
  }
}

// REST client
const rest = new REST().setToken(process.env.TOKEN);

// سجل الأوامر
(async () => {
  try {
    console.log(`🚀 تسجيل ${commands.length} أمر...`);

    // للتجربة السريعة نسجل على السيرفر فقط (GUILD COMMANDS)
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log(`✅ تسجّل ${data.length} أمر بنجاح!`);
  } catch (error) {
    console.error(error);
  }
})();
