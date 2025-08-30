const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send a styled message via the bot in this channel")
    // Required options أولاً
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Title of the message")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("Main content of the message")
        .setRequired(true)
    )
    // الخيارات الاختيارية بعد الـ required
    .addStringOption((option) =>
      option
        .setName("subject")
        .setDescription("Subject of the message")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Hex color for the embed")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("Image URL to include")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("mention")
        .setDescription("Role to mention")
        .setRequired(false)
    )
    // بس الأدمنس يقدروا يستخدموه
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const title = interaction.options.getString("title");
    const content = interaction.options.getString("content");
    const subject = interaction.options.getString("subject") || "No subject";
    const color = interaction.options.getString("color") || "#00ffff"; // لون افتراضي
    const image = interaction.options.getString("image");
    const role = interaction.options.getRole("mention");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .addFields(
        { name: "Subject", value: subject },
        { name: "Content", value: content }
      )
      .setColor(color)
      .setFooter({ text: `Sent by ${interaction.user.tag}` })
      .setTimestamp();

    if (image) embed.setImage(image);

    // ارسال الرسالة مع Mention لو فيه
    if (role) {
      await interaction.channel.send({ content: `${role}`, embeds: [embed] });
    } else {
      await interaction.channel.send({ embeds: [embed] });
    }

    await interaction.reply({ content: "✅ Message sent!", ephemeral: true });
  },
};
