const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Setup the ticket system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // يحتاج صلاحية Manage Channels
  async execute(interaction) {
    // تحقق إضافي
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      return interaction.reply({
        content:
          "❌ You need the Manage Channels permission to use this command.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Tickets")
      .setDescription("Click the button below to create a ticket.")
      .setColor(0x00ffff)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("Create Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "✅ Ticket system setup successfully!",
      ephemeral: true,
    });
  },
};
