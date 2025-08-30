const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to mute")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for mute")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const muteRole = interaction.guild.roles.cache.find(
      (r) => r.name === "Muted"
    );

    if (!member || !muteRole)
      return interaction.reply({
        content: "❌ Member or Mute role not found.",
        ephemeral: true,
      });

    try {
      await member.roles.add(muteRole, reason);

      const embed = new EmbedBuilder()
        .setTitle("🔇 Member Muted")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `${member.user.tag}`, inline: true },
          { name: "ID", value: member.id, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setFooter({
          text: `Action by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Couldn't mute this member.",
        ephemeral: true,
      });
    }
  },
};
