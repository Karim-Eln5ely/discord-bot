const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show avatar")
    .addUserOption((opt) =>
      opt.setName("target").setDescription("member").setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("target") || interaction.user;
    const url = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setTitle(`${user.tag} — Avatar`)
      .setImage(url)
      .setColor(0x00ae86);

    await interaction.reply({ embeds: [embed] });
  },
};
