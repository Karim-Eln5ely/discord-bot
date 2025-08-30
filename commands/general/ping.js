const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("🏓replay Pong and show latency"),
  async execute(interaction, client) {
    // نرسل رسالة مؤقتة عشان نحسب roundtrip
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const api = Math.round(client.ws.ping);
    await interaction.editReply(
      `🏓 Pong!\n• Roundtrip: \`${roundtrip}ms\`\n• API: \`${api}ms\``
    );
  },
};
