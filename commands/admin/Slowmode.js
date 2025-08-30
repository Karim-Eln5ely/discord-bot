const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode duration for a channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to set slowmode")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration in seconds")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const duration = interaction.options.getInteger("duration");

    try {
      await channel.setRateLimitPerUser(duration);

      const embed = new EmbedBuilder()
        .setTitle("⏱ Slowmode Set")
        .setDescription(`Slowmode of ${duration} seconds set for ${channel}`)
        .setColor(0x00ffff)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't set slowmode.",
        ephemeral: true,
      });
    }
  },
};
