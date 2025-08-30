const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription(" Server information "),
  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setTitle(`Server: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "ID", value: guild.id, inline: true },
        { name: "Owner", value: `${owner.user.tag}`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        {
          name: "Created",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true,
        }
      )
      .setColor(0x00ae86);

    await interaction.reply({ embeds: [embed] });
  },
};
