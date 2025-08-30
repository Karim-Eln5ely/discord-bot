const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to unlock")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    try {
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: true }
      );

      const embed = new EmbedBuilder()
        .setTitle("🔓 Channel Unlocked")
        .setDescription(`Channel ${channel} is now unlocked.`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't unlock the channel.",
        ephemeral: true,
      });
    }
  },
};
