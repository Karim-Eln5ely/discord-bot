const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription(" Show member info ")
    .addUserOption((opt) =>
      opt.setName("target").setDescription("member").setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("target") || interaction.user;
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    const roles = member
      ? member.roles.cache
          .filter((r) => r.id !== interaction.guild.id)
          .map((r) => r.toString())
          .slice(0, 10)
          .join(", ") || "—"
      : "—";

    const embed = new EmbedBuilder()
      .setTitle(`${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "ID", value: user.id, inline: true },
        {
          name: "Joined Server",
          value: member
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : "—",
          inline: true,
        },
        {
          name: "Account Created",
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: "Roles", value: roles, inline: false }
      )
      .setColor(0x0099ff);

    await interaction.reply({ embeds: [embed] });
  },
};
