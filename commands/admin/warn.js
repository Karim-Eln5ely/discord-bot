const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Warning = require("../../db/models/warnning.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to warn")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for warning")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const newWarning = new Warning({
      guildId: interaction.guild.id,
      userId: member.id,
      reason,
      by: interaction.user.tag,
    });

    await newWarning.save();

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Member Warned")
      .setDescription(`${member} has been warned.`)
      .addFields({ name: "Reason", value: reason })
      .setColor(0xffa500)
      .setFooter({ text: `Warned by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
