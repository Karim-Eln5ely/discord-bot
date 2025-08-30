const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member for a certain duration")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to timeout")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration in minutes")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for timeout")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const duration = interaction.options.getInteger("duration");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!member)
      return interaction.reply({
        content: "❌ Member not found.",
        ephemeral: true,
      });

    try {
      await member.timeout(duration * 60 * 1000, reason); // بالمللي ثانية

      const embed = new EmbedBuilder()
        .setTitle("⏱ Member Timed Out")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `${member.user.tag}`, inline: true },
          { name: "ID", value: member.id, inline: true },
          { name: "Duration", value: `${duration} minutes`, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setFooter({
          text: `Action by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0x00ffff)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't timeout this member.",
        ephemeral: true,
      });
    }
  },
};
