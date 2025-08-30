const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("show order list "),
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle("📚 Commands")
      .setDescription(
        "قائمة الأوامر المتاحة (اختصار). استخدم `/help` للحصول على المساعدة الخاصة بكل أمر."
      )
      .setColor(0x00ae86);

    // نجمع أسماء الأوامر ووصفها
    const lines = [];
    client.commands.forEach((cmd) => {
      const desc = cmd.data.description || "—";
      lines.push(`**/${cmd.data.name}** — ${desc}`);
    });

    // تجنُّب تجاوز حد 1024 حرف في الحقول
    let value = lines.join("\n");
    if (value.length > 1000) value = value.slice(0, 1000) + "\n...";

    embed.addFields({ name: "Available", value });

    // أخفِ النتيجة للمستخدم requester فقط (ephemeral)
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
