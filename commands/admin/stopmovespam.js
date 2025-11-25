// ./commands/admin/stopmovespam.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stopmovespam")
    .setDescription("يوقف أي نقل عشوائي جاري في السيرفر (Admin Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    if (!interaction.client.activeMoveSpams.has(guildId)) {
      return interaction.reply({
        content: "لا توجد عملية نقل جارية في هذا السيرفر.",
        ephemeral: true,
      });
    }

    clearInterval(interaction.client.activeMoveSpams.get(guildId));
    interaction.client.activeMoveSpams.delete(guildId);

    const embed = new EmbedBuilder()
      .setTitle("STOPPED!")
      .setDescription("تم إيقاف النقل العشوائي بنجاح.")
      .setColor("#ff0000")
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};