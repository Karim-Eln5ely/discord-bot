const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Warning = require("../../db/models/warnning.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unwarn")
    .setDescription("Remove the last warning from a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to remove warning from")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");

    const lastWarning = await Warning.findOneAndDelete(
      { guildId: interaction.guild.id, userId: member.id },
      { sort: { date: -1 } }
    );

    if (!lastWarning)
      return interaction.reply({
        content: "❌ This member has no warnings.",
        ephemeral: true,
      });

    const embed = new EmbedBuilder()
      .setTitle("✅ Warning Removed")
      .setDescription(`Removed the last warning from ${member.user.tag}`)
      .addFields({ name: "Reason", value: lastWarning.reason })
      .setColor(0x00ff00)
      .setFooter({ text: `Action by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
