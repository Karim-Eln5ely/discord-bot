module.exports = {
  name: "messageDelete",
  async execute(message) {
    if (message.author.bot) return;
    const logChannel = message.guild.channels.cache.find(ch => ch.name === "text-logs");
    if (!logChannel) return;

    logChannel.send({
      embeds: [{
        title: "🗑️ Message Deleted",
        description: `Author: ${message.author.tag}\nChannel: ${message.channel}\nContent: ${message.content}`,
        color: 0xff0000,
        timestamp: new Date(),
      }],
    });
  },
};
