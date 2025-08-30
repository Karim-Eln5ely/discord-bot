const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to lock")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    try {
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: false }
      );

      const embed = new EmbedBuilder()
        .setTitle("🔒 Channel Locked")
        .setDescription(`Channel ${channel} is now locked.`)
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't lock the channel.",
        ephemeral: true,
      });
    }
  },
};
