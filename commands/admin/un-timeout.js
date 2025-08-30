const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove timeout from a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to remove timeout")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");
    if (!member)
      return interaction.reply({
        content: "❌ Member not found.",
        ephemeral: true,
      });

    try {
      await member.timeout(null); // null لإزالة الـ timeout

      const embed = new EmbedBuilder()
        .setTitle("✅ Member Timeout Removed")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `${member.user.tag}`, inline: true },
          { name: "ID", value: member.id, inline: true }
        )
        .setFooter({
          text: `Action by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't remove timeout.",
        ephemeral: true,
      });
    }
  },
};
