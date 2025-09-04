const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const PrayerSettings = require("../../db/models/prayer.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-prayer")
    .setDescription("إعداد أوقات الصلاة للسيرفر")
    .addStringOption((option) =>
      option
        .setName("city")
        .setDescription("المدينة لأوقات الصلاة (مثل: القاهرة)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("country")
        .setDescription("الدولة لأوقات الصلاة (مثل: مصر)")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("announcement_channel")
        .setDescription("الروم لإعلانات أوقات الصلاة")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("prayer_role")
        .setDescription("الرول لمنشنها في الإعلانات")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const prayerSetupChannelId = "1413212018562830516"; // غيّر ده بـ ID الروم الخاصة بالـ setup

      if (interaction.channel.id !== prayerSetupChannelId) {
        return interaction.editReply({
          content: "❌ هذا الأمر يعمل فقط في روم إعدادات الصلاة!",
        });
      }

      const city = interaction.options.getString("city");
      const country = interaction.options.getString("country");
      const announcementChannel = interaction.options.getChannel(
        "announcement_channel"
      );
      const prayerRole = interaction.options.getRole("prayer_role");

      // التأكد إن الروم للإعلانات من نوع نصي
      if (announcementChannel.type !== 0) {
        // GUILD_TEXT = 0
        return interaction.editReply({
          content: "❌ يجب اختيار روم نصية للإعلانات!",
        });
      }

      // حفظ الإعدادات
      await PrayerSettings.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          city,
          country,
          announcementChannelId: announcementChannel.id,
          prayerRoleId: prayerRole.id,
        },
        { upsert: true, new: true }
      );

      const embed = new EmbedBuilder()
        .setTitle("✅ تم إعداد الصلاة بنجاح")
        .setDescription(
          `أوقات الصلاة مُعدة لـ ${city}، ${country}.\nالإعلانات في <#${announcementChannel.id}> مع منشن لـ <@&${prayerRole.id}>.`
        )
        .setColor("#00FF00");

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in setup-prayer command:", error);
      await interaction.editReply({
        content: "❌ حصل خطأ أثناء إعداد أوقات الصلاة. حاول مرة أخرى لاحقًا.",
      });
    }
  },
};
