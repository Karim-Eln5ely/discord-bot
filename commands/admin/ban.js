const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .addUserOption(option =>
      option
        .setName("target")
        .setDescription("The member you want to ban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for banning the member")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    let member;
    try {
      member = await interaction.guild.members.fetch(target.id);
    } catch {
      member = null;
    }

    if (!member) {
      return interaction.reply({
        content: "❌ Could not find that member in the server.",
        flags: 64, // ephemeral
      });
    }

    try {
      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setTitle("🚫 Member Banned")
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `${target.tag}`, inline: true },
          { name: "ID", value: target.id, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setFooter({
          text: `Banned by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ I couldn't ban this member. Check my permissions.",
        flags: 64,
      });
    }
  },
};
