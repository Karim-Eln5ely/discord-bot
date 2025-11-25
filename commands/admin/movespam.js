// ./commands/admin/movespam.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("movespam")
    .setDescription("ينقل عضو عشوائيًا بين القنوات الصوتية بعدد محدد (Admin Only)")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("العضو المراد نقله")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("عدد مرات النقل (1-50)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(50)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getMember("target");
    const count = interaction.options.getInteger("count");
    const guildId = interaction.guild.id;

    // جلب القنوات الصوتية اللي البوت يقدر ينقل فيها
    const voiceChannels = interaction.guild.channels.cache.filter(
      (ch) =>
        ch.type === ChannelType.GuildVoice &&
        ch.permissionsFor(interaction.guild.members.me).has("MoveMembers")
    );

    if (voiceChannels.size < 2) {
      return interaction.editReply({
        content: "يجب أن يكون هناك قناتان صوتيتان على الأقل للنقل العشوائي!",
        ephemeral: true,
      });
    }

    if (!target.voice.channel) {
      return interaction.editReply({
        content: "العضو غير موجود في قناة صوتية!",
        ephemeral: true,
      });
    }

    const channelsArray = voiceChannels.map((ch) => ch);

    // إلغاء أي عملية سابقة في نفس السيرفر
    if (interaction.client.activeMoveSpams.has(guildId)) {
      clearInterval(interaction.client.activeMoveSpams.get(guildId));
    }

    const embed = new EmbedBuilder()
      .setTitle("CHAOS MODE ACTIVATED!")
      .setDescription(
        `**${target}** سيتم نقله **عشوائيًا** \`${count}\` مرة بين **${channelsArray.length}** قناة!`
      )
      .setColor("#ff00ff")
      .setTimestamp();

    const msg = await interaction.editReply({ embeds: [embed] });

    let moved = 0;
    const interval = setInterval(async () => {
      try {
        // اختيار قناة عشوائية (غير الحالية)
        let randomChannel;
        do {
          randomChannel =
            channelsArray[Math.floor(Math.random() * channelsArray.length)];
        } while (
          randomChannel.id === target.voice.channel?.id &&
          channelsArray.length > 1
        );

        await target.voice.setChannel(randomChannel);
        moved++;

        embed.setDescription(
          `**${target}** تم نقله \`${moved}/${count}\` مرة → ${randomChannel}`
        );
        await msg.edit({ embeds: [embed] });

        if (moved >= count) {
          clearInterval(interval);
          interaction.client.activeMoveSpams.delete(guildId);
          embed
            .setDescription(`انتهى الـ Chaos! تم نقل ${target} \`${count}\` مرة!`)
            .setColor("#00ff00");
          await msg.edit({ embeds: [embed] });
        }
      } catch (error) {
        clearInterval(interval);
        interaction.client.activeMoveSpams.delete(guildId);
        await msg.edit({
          content: `فشل النقل: ${error.message}`,
        });
      }
    }, 700);

    // حفظ الـ interval
    interaction.client.activeMoveSpams.set(guildId, interval);
  },
};