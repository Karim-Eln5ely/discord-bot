// commands/game/stop-mafia.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");

const {
  activeGames,
  cleanupGame,
  getGameStats,
  playerSelections,
} = require("../../utils/mafiaState");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop-mafia")
    .setDescription("إيقاف لعبة المافيا النشطة")
    .addBooleanOption((option) =>
      option
        .setName("force")
        .setDescription("إيقاف قسري بدون تأكيد")
        .setRequired(false)
    ),

  async execute(interaction) {
    const channelId = interaction.channel.id;
    const isForceStop = interaction.options.getBoolean("force") || false;

    // فحص وجود اللعبة
    if (!activeGames.has(channelId)) {
      return interaction.reply({
        content: "❌ لا توجد لعبة مافيا نشطة في هذه القناة!",
        ephemeral: true,
      });
    }

    const game = activeGames.get(channelId);

    // فحص الصلاحيات (منشئ اللعبة أو مدير)
    const hasPermission =
      interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
      game.players[0] === interaction.user.id; // أول لاعب عادة منشئ اللعبة

    if (!hasPermission && !isForceStop) {
      return interaction.reply({
        content:
          "❌ تحتاج صلاحية إدارة الرسائل أو أن تكون منشئ اللعبة لإيقافها!",
        ephemeral: true,
      });
    }

    // الحصول على إحصائيات اللعبة قبل الحذف
    const stats = getGameStats(game);

    // إيقاف قسري بدون تأكيد
    if (isForceStop) {
      cleanupGame(channelId);

      const stopEmbed = new EmbedBuilder()
        .setTitle("🛑 تم إيقاف اللعبة قسرياً")
        .setDescription("تم إيقاف لعبة المافيا بواسطة المدير")
        .setColor("#FF0000")
        .addFields({
          name: "📊 إحصائيات اللعبة",
          value: `**المرحلة:** ${stats.phase}\n**الجولة:** ${stats.round}\n**اللاعبين:** ${stats.totalPlayers}`,
          inline: true,
        })
        .setTimestamp();

      return interaction.reply({ embeds: [stopEmbed] });
    }

    // إنشاء رسالة تأكيد
    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ تأكيد إيقاف اللعبة")
      .setDescription("هل أنت متأكد من إيقاف لعبة المافيا النشطة؟")
      .setColor("#FFA500")
      .addFields(
        {
          name: "📊 معلومات اللعبة الحالية",
          value: `**المرحلة:** ${getPhaseDisplayName(stats.phase)}
**الجولة:** ${stats.round}
**إجمالي اللاعبين:** ${stats.totalPlayers}
**الأحياء:** ${stats.alivePlayers}
**الموتى:** ${stats.deadPlayers}`,
          inline: true,
        },
        {
          name: "🎭 الأدوار الحية",
          value: `🔴 المافيا: ${stats.aliveRoles.mafia}
🕵️ الشيرف: ${stats.aliveRoles.sheriff}
⚕️ الطبيب: ${stats.aliveRoles.doctor}
🔵 المواطنون: ${stats.aliveRoles.citizens}`,
          inline: true,
        }
      )
      .setFooter({
        text: "سيتم حذف هذه الرسالة بعد 30 ثانية إذا لم يتم اتخاذ قرار",
      });

    const confirmButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_stop_${channelId}`)
        .setLabel("✅ نعم، أوقف اللعبة")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`cancel_stop_${channelId}`)
        .setLabel("❌ إلغاء")
        .setStyle(ButtonStyle.Secondary)
    );

    const confirmMessage = await interaction.reply({
      embeds: [confirmEmbed],
      components: [confirmButtons],
      ephemeral: true,
    });

    // إعداد مُجمع للأزرار
    const filter = (i) => {
      return (
        (i.customId === `confirm_stop_${channelId}` ||
          i.customId === `cancel_stop_${channelId}`) &&
        i.user.id === interaction.user.id
      );
    };

    const collector = confirmMessage.createMessageComponentCollector({
      filter,
      time: 30000, // 30 ثانية
      max: 1,
    });

    collector.on("collect", async (i) => {
      if (i.customId === `confirm_stop_${channelId}`) {
        // تأكيد الإيقاف
        const finalStats = getGameStats(activeGames.get(channelId));
        cleanupGame(channelId);

        const stoppedEmbed = new EmbedBuilder()
          .setTitle("🛑 تم إيقاف لعبة المافيا")
          .setDescription(`تم إيقاف اللعبة بواسطة ${interaction.user}`)
          .setColor("#FF0000")
          .addFields(
            {
              name: "📊 إحصائيات نهائية",
              value: `**المرحلة النهائية:** ${getPhaseDisplayName(
                finalStats.phase
              )}
**عدد الجولات:** ${finalStats.round}
**إجمالي اللاعبين:** ${finalStats.totalPlayers}`,
              inline: true,
            },
            {
              name: "🎯 الإجراءات المنجزة",
              value: `🔪 عمليات قتل: ${finalStats.actions.mafiaKills}
⚰️ إعدامات: ${finalStats.actions.citizenExecutions}
🛡️ إنقاذات: ${finalStats.actions.doctorSaves}
🔍 تحقيقات: ${finalStats.actions.sheriffInvestigations}`,
              inline: true,
            }
          )
          .setTimestamp();

        await i.update({
          embeds: [stoppedEmbed],
          components: [],
        });

        // إرسال رسالة عامة في القناة
        await interaction.followUp({
          content: "🛑 **تم إيقاف لعبة المافيا بنجاح!**",
          ephemeral: false,
        });
      } else if (i.customId === `cancel_stop_${channelId}`) {
        // إلغاء الإيقاف
        const cancelEmbed = new EmbedBuilder()
          .setTitle("✅ تم إلغاء الإيقاف")
          .setDescription("اللعبة ما زالت مستمرة")
          .setColor("#00FF00");

        await i.update({
          embeds: [cancelEmbed],
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // انتهى الوقت بدون رد
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏱️ انتهى الوقت")
          .setDescription("تم إلغاء طلب إيقاف اللعبة لعدم الرد في الوقت المحدد")
          .setColor("#808080");

        await interaction
          .editReply({
            embeds: [timeoutEmbed],
            components: [],
          })
          .catch(() => {});
      }
    });
  },
};

// دالة مساعدة لعرض اسم المرحلة بشكل أنيق
function getPhaseDisplayName(phase) {
  const phaseNames = {
    lobby: "🏛️ صالة الانتظار",
    night: "🌙 المرحلة الليلية",
    day: "☀️ المرحلة النهارية",
    voting: "🗳️ مرحلة التصويت",
    ended: "🏁 انتهت اللعبة",
  };

  return phaseNames[phase] || `❓ ${phase}`;
}
