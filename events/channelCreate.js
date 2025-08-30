module.exports = {
  name: "channelCreate",
  async execute(channel) {
    const logChannel = channel.guild.channels.cache.find(
      (ch) => ch.name === "text-logs"
    );
    if (!logChannel) return;

    logChannel.send({
      embeds: [
        {
          title: "➕ Channel Created",
          description: `Channel ${channel} was created`,
          color: 0x00ff00,
          timestamp: new Date(),
        },
      ],
    });
  },
};
