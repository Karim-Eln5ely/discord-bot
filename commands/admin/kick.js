const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for kick")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!member) {
      return interaction.reply({
        content: "❌ Member not found.",
        ephemeral: true,
      });
    }

    try {
      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setTitle("✅ Member Kicked")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `${member.user.tag}`, inline: true },
          { name: "ID", value: member.id, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setFooter({
          text: `Kicked by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0xffa500)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ I couldn't kick this member.",
        ephemeral: true,
      });
    }
  },
};
