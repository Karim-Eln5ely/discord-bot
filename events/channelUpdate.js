module.exports = {
  name: "channelUpdate",
  async execute(oldChannel, newChannel) {
    const logChannel = newChannel.guild.channels.cache.find(ch => ch.name === "text-logs");
    if (!logChannel) return;

    logChannel.send({
      embeds: [{
        title: "📝 Channel Updated",
        description: `Channel ${newChannel.name} was updated`,
        color: 0xffff00,
        timestamp: new Date(),
      }],
    });
  },
};
