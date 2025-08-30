const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Warning = require("../../db/models/warnning.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Show all warnings for a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to check")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getMember("member");

    const memberWarnings = await Warning.find({
      guildId: interaction.guild.id,
      userId: member.id,
    }).sort({ date: 1 });

    if (memberWarnings.length === 0)
      return interaction.reply({
        content: "✅ This member has no warnings.",
        ephemeral: true,
      });

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings for ${member.user.tag}`)
      .setDescription(
        memberWarnings
          .map((w, i) => `${i + 1}. ${w.reason} (by ${w.by})`)
          .join("\n")
      )
      .setColor(0xffa500)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
