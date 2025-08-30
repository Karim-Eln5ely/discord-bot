module.exports = {
  name: "messageUpdate",
  async execute(oldMessage, newMessage) {
    if (oldMessage.author.bot) return;
    const logChannel = oldMessage.guild.channels.cache.find(ch => ch.name === "text-logs");
    if (!logChannel) return;

    logChannel.send({
      embeds: [{
        title: "✏️ Message Edited",
        description: `Author: ${oldMessage.author.tag}\nChannel: ${oldMessage.channel}`,
        fields: [
          { name: "Before", value: oldMessage.content || "Empty" },
          { name: "After", value: newMessage.content || "Empty" }
        ],
        color: 0xffff00,
        timestamp: new Date(),
      }],
    });
  },
};
