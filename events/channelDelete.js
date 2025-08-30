module.exports = {
  name: "channelDelete",
  async execute(channel) {
    const logChannel = channel.guild.channels.cache.find(ch => ch.name === "text-logs");
    if (!logChannel) return;

    logChannel.send({
      embeds: [{
        title: "❌ Channel Deleted",
        description: `Channel ${channel.name} was deleted`,
        color: 0xff0000,
        timestamp: new Date(),
      }],
    });
  },
};
