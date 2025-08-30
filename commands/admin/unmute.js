const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to unmute")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const muteRole = interaction.guild.roles.cache.find(
      (r) => r.name === "Muted"
    );

    if (!member || !muteRole)
      return interaction.reply({
        content: "❌ Member or Mute role not found.",
        ephemeral: true,
      });

    try {
      await member.roles.remove(muteRole);

      const embed = new EmbedBuilder()
        .setTitle("✅ Member Unmuted")
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
        content: "❌ Couldn't unmute this member.",
        ephemeral: true,
      });
    }
  },
};
