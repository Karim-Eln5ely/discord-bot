module.exports = {
  name: 'messageCreate',
  execute: async (message, client) => {
    if (message.author.bot) return;

    // التحقق من وجود "علمطبخ" ومنشن أولاً
    if (message.content.includes('علمطبخ') && message.mentions.members.size > 0) {
      const mentionedMember = message.mentions.members.first();
      if (!mentionedMember) return;

      // التحقق إذا العضو عنده الرول المطلوب
      const requiredRoleId = '1380531520028016681';
      if (!message.member.roles.cache.has(requiredRoleId)) {
        return message.reply('بس يفلاح');
      }

      const TARGET_CHANNEL_ID = '1257243835621445632';
      const targetChannel = await message.guild.channels.fetch(TARGET_CHANNEL_ID);

      if (!targetChannel) {
        return message.reply('الروم غير موجود!');
      }
      if (targetChannel.type !== 2) {
        return message.reply('الروم مش روم صوتية!');
      }
      if (!message.guild.members.me.permissions.has('MoveMembers')) {
        return message.reply('البوت عنده صلاحيات ناقصة!');
      }

      try {
        await mentionedMember.voice.setChannel(targetChannel);
        message.reply(`كبايتين شاي في ايديك يا ${mentionedMember.user.tag}`);
      } catch (error) {
        console.error('Error moving member:', error);
        message.reply('حصل خطأ! تأكد إن العضو في روم صوتية أصلاً.');
      }
    }
  },
};