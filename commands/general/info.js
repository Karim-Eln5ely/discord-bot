const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function msToTime(ms) {
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hrs = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hrs}h ${min}m ${sec}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("bot information"),
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle(`${client.user.username} — Info`)
      .addFields(
        { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
        {
          name: "Users (cached)",
          value: `${client.users.cache.size}`,
          inline: true,
        },
        { name: "Uptime", value: msToTime(client.uptime || 0), inline: true }
      )
      .setFooter({ text: `ID: ${client.user.id}` })
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
