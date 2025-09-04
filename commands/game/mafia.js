const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  activeGames,
  createGameData,
  GAME_SETTINGS,
  validateGame,
  calculateMafiaCount,
} = require("../../utils/mafiaState");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mafia")
    .setDescription("بدء لعبة المافيا")
    .addBooleanOption((option) =>
      option
        .setName("quick")
        .setDescription("بدء سريع بدون انتظار (للاختبار)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(0), // متاح للجميع

  async execute(interaction) {
    try {
      await interaction.deferReply(); // تأخير الرد لتجنب Unknown Interaction

      const channelId = interaction.channel.id;
      const isQuickStart = interaction.options.getBoolean("quick") || false;

      // فحص اللعبة الموجودة
      if (activeGames.has(channelId)) {
        const existingGame = activeGames.get(channelId);
        return interaction.editReply({
          content: `❌ يوجد لعبة مافيا نشطة بالفعل في هذه القناة!\n📊 **المرحلة:** ${existingGame.phase}\n👥 **اللاعبين:** ${existingGame.players.length}`,
          ephemeral: true,
        });
      }

      // إنشاء لعبة جديدة
      const gameData = createGameData(channelId);
      activeGames.set(channelId, gameData);

      // إضافة منشئ اللعبة تلقائياً في الوضع السريع
      if (isQuickStart) {
        gameData.players.push(interaction.user.id);
      }

      const gameEmbed = new EmbedBuilder()
        .setTitle("🎭 لعبة المافيا")
        .setDescription(
          `**📋 قوانين اللعبة:**
🌙 **المرحلة الليلية:**
• **🕵️ الشيرف:** يحقق مع شخص واحد لمعرفة إذا كان مافيا أم لا
• **⚕️ الطبيب:** يحمي شخصاً واحداً من القتل (بما فيهم نفسه)
• **🔪 المافيا:** تقتل شخصاً واحداً بشكل جماعي
☀️ **المرحلة النهارية:**
• جميع اللاعبين يناقشون ويصوتون لإعدام المشتبه به
• اللاعب الحاصل على أكثر الأصوات يتم إعدامه
• في حالة التعادل، لا يتم إعدام أحد
**🎯 أهداف الفوز:**
• **المواطنون:** القضاء على جميع أعضاء المافيا
• **المافيا:** مساواة أو تفوق عدد المواطنين
**⚙️ إعدادات اللعبة:**
• **عدد اللاعبين:** ${GAME_SETTINGS.MIN_PLAYERS}-${GAME_SETTINGS.MAX_PLAYERS}
• **توزيع الأدوار:** يتم حسب العدد تلقائياً`
        )
        .setColor("#FF6B6B")
        .addFields(
          {
            name: "👥 اللاعبين المنضمين",
            value:
              isQuickStart && gameData.players.length > 0
                ? `1. ${interaction.user.username} 👑`
                : "لا يوجد لاعبين حتى الآن",
            inline: false,
          },
          {
            name: "📊 توزيع الأدوار المتوقع",
            value: generateRoleDistribution(gameData.players.length),
            inline: true,
          }
        )
        .setFooter({
          text: `مطلوب ${
            GAME_SETTINGS.MIN_PLAYERS
          } لاعبين على الأقل للبدء | المدة: ${
            GAME_SETTINGS.NIGHT_TIME_LIMIT / 1000
          }ث لكل دور ليلي`,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("join_mafia")
          .setLabel("🎮 انضمام للعبة")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("leave_mafia")
          .setLabel("🚪 مغادرة اللعبة")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("start_mafia")
          .setLabel("▶️ بدء اللعبة")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("cancel_mafia")
          .setLabel("❌ إلغاء اللعبة")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({
        embeds: [gameEmbed],
        components: [buttons],
      });

      // رسالة إضافية للإرشادات
      setTimeout(async () => {
        const instructionsEmbed = new EmbedBuilder()
          .setTitle("📖 كيفية اللعب")
          .setDescription(
            `**للاعبين الجدد:**
🔹 **انضم للعبة** بالضغط على زر "انضمام للعبة"
🔹 **انتظر** حتى يصل العدد للحد الأدنى (${GAME_SETTINGS.MIN_PLAYERS} لاعبين)
🔹 **ستتلقى رسالة خاصة** بدورك عند بدء اللعبة
🔹 **اتبع التعليمات** في الرسالة الخاصة لاستخدام قدراتك
**💡 نصائح مهمة:**
• تأكد من فتح الرسائل الخاصة للبوت
• لا تكشف دورك علناً (إلا الشيرف عند الحاجة)
• راقب سلوك اللاعبين وردود أفعالهم
• استخدم النقاش النهاري بذكاء`
          )
          .setColor("#FFA500")
          .setFooter({ text: "هذه الرسالة ستختفي بعد دقيقة واحدة" });

        const msg = await interaction.followUp({
          embeds: [instructionsEmbed],
          ephemeral: false,
        });

        // حذف رسالة الإرشادات بعد دقيقة
        setTimeout(() => {
          msg.delete().catch(() => {});
        }, 60000);
      }, 2000);
    } catch (error) {
      console.error("Error in mafia command:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ حصل خطأ أثناء بدء اللعبة. حاول مرة أخرى لاحقاً.",
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: "❌ حصل خطأ أثناء بدء اللعبة. حاول مرة أخرى لاحقاً.",
        });
      }
    }
  },
};

// دالة مساعدة لعرض توزيع الأدوار المتوقع
function generateRoleDistribution(playerCount) {
  if (playerCount < GAME_SETTINGS.MIN_PLAYERS) {
    return `مطلوب ${GAME_SETTINGS.MIN_PLAYERS - playerCount} لاعب إضافي`;
  }
  const mafiaCount = calculateMafiaCount(playerCount);
  const citizenCount = playerCount - mafiaCount - 2; // -2 للشيرف والطبيب
  return [
    `🔴 المافيا: ${mafiaCount}`,
    `🕵️ الشيرف: 1`,
    `⚕️ الطبيب: 1`,
    `🔵 المواطنون: ${citizenCount}`,
  ].join("\n");
}
