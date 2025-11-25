// events/voiceWaiting.js
const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// ======== غيّر الـ IDs دي بس =========
const WAITING_ROOM_ID = "1437886001690447953";     // روم الانتظار
const ADMIN_VOICE_ID = "1361338723236839614";      // روم الأدمن الصوتي (اللي هينقلوه فيه)
const ADMIN_CHAT_ID = "1188637577574625478";       // روم الشات اللي هيظهر فيه الطلب
// =======================================

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    // لو دخل روم الانتظار وما كانش فيه قبل كده
    if (
      newState.channelId === WAITING_ROOM_ID &&
      oldState.channelId !== WAITING_ROOM_ID
    ) {
      const member = newState.member;
      if (member.user.bot) return;

      const guild = newState.guild;
      const adminChat = guild.channels.cache.get(ADMIN_CHAT_ID);

      if (!adminChat) {
        return console.log("روم الشات الإداري مش موجود! تأكد من الـ ID:", ADMIN_CHAT_ID);
      }

      const embed = new EmbedBuilder()
        .setTitle("طلب دخول روم الأدمن")
        .setDescription(
          `**العضو**: ${member}\n**في روم الانتظار**: <#${WAITING_ROOM_ID}>\n**الوقت**: <t:${Math.floor(Date.now() / 1000)}:t>`
        )
        .setColor("#2B2D31")
        .setThumbnail(member.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `ID: ${member.id}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`admin_approve_${member.id}`)
          .setLabel("موافقة")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`admin_decline_${member.id}`)
          .setLabel("رفض")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Danger)
      );

      try {
        const msg = await adminChat.send({
          content: "طلب جديد للدخول إلى روم الأدمن الصوتي",
          embeds: [embed],
          components: [row],
        });

        // إخفاء الأزرار بعد 5 دقايق (أو 10 زي ما تحب)
        setTimeout(async () => {
          try {
            if (msg.editable) {
              const disabledRow = ActionRowBuilder.from(row);
              disabledRow.components.forEach(btn => btn.setDisabled(true));
              await msg.edit({ components: [disabledRow] });
            }
          } catch (e) { /* لو الرسالة اتحذفت خلاص */ }
        }, 5 * 60 * 1000);

      } catch (error) {
        console.error("فشل في إرسال طلب الانتظار:", error);
      }
    }
  },
};