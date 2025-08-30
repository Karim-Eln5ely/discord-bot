const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server")
    .addStringOption((option) =>
      option
        .setName("userid")
        .setDescription("The ID of the user to unban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unbanning the user")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString("userid");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    try {
      // نحاول نجيب الـ ban عشان نتأكد إنه موجود
      const banInfo = await interaction.guild.bans.fetch(userId);

      if (!banInfo) {
        return interaction.reply({
          content: "❌ This user is not banned.",
          flags: 64,
        });
      }

      await interaction.guild.members.unban(userId, reason);

      const embed = new EmbedBuilder()
        .setTitle("✅ Member Unbanned")
        .setThumbnail(banInfo.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `${banInfo.user.tag}`, inline: true },
          { name: "ID", value: banInfo.user.id, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setFooter({
          text: `Unbanned by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "❌ I couldn't unban this user. Check the ID or my permissions.",
        flags: 64,
      });
    }
  },
};
