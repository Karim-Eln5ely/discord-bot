module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    const logChannel = member.guild.channels.cache.find(
      (ch) => ch.name === "member-logs"
    );
    if (!logChannel) return;

    logChannel.send({
      embeds: [
        {
          title: "👤 New Member Joined",
          description: `${member} joined the server`,
          fields: [
            { name: "Username", value: member.user.tag, inline: true },
            { name: "User ID", value: member.id, inline: true },
            {
              name: "Account Created",
              value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
          ],
          color: 0x00ffff,
          timestamp: new Date(),
        },
      ],
    });
  },
};
