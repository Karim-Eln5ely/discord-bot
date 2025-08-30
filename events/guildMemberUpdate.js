module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    const logChannel = newMember.guild.channels.cache.find(
      (ch) => ch.name === "profile-logs"
    );
    if (!logChannel) return;

    // nickname change
    if (oldMember.nickname !== newMember.nickname) {
      logChannel.send({
        embeds: [
          {
            title: "✏️ Nickname Updated",
            description: `${newMember} changed nickname`,
            fields: [
              {
                name: "Before",
                value: oldMember.nickname || "None",
                inline: true,
              },
              {
                name: "After",
                value: newMember.nickname || "None",
                inline: true,
              },
            ],
            color: 0xffff00,
            timestamp: new Date(),
          },
        ],
      });
    }

    // يمكن إضافة تغييرات Roles أو Timeout إذا حبيت
  },
};
