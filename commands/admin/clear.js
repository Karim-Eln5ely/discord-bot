const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear messages from a channel")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      const embed = new EmbedBuilder()
        .setTitle("🧹 Messages Cleared")
        .setDescription(`Deleted ${deleted.size} messages`)
        .setColor(0xffff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't clear messages.",
        ephemeral: true,
      });
    }
  },
};
