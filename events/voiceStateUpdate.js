module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    const logChannel = newState.guild.channels.cache.find(
      (ch) => ch.name === "voice-logs"
    );
    if (!logChannel) return;

    // دخل قناة
    if (!oldState.channel && newState.channel) {
      logChannel.send({
        embeds: [
          {
            title: "🎤 Voice Channel Joined",
            description: `${newState.member} joined ${newState.channel}`,
            color: 0x00ff00,
            timestamp: new Date(),
          },
        ],
      });
    }

    // خرج من قناة
    if (oldState.channel && !newState.channel) {
      logChannel.send({
        embeds: [
          {
            title: "🎤 Voice Channel Left",
            description: `${oldState.member} left ${oldState.channel}`,
            color: 0xff0000,
            timestamp: new Date(),
          },
        ],
      });
    }

    // mute/deafen
    if (oldState.serverMute !== newState.serverMute) {
      logChannel.send({
        embeds: [
          {
            title: "🔇 Server Mute Updated",
            description: `${newState.member} was ${
              newState.serverMute ? "muted" : "unmuted"
            } by admin`,
            color: 0xffff00,
            timestamp: new Date(),
          },
        ],
      });
    }

    if (oldState.serverDeaf !== newState.serverDeaf) {
      logChannel.send({
        embeds: [
          {
            title: "🔈 Server Deafen Updated",
            description: `${newState.member} was ${
              newState.serverDeaf ? "deafened" : "undeafened"
            } by admin`,
            color: 0xffff00,
            timestamp: new Date(),
          },
        ],
      });
    }

    // نقل عضو لقناة ثانية
    if (
      oldState.channel &&
      newState.channel &&
      oldState.channel.id !== newState.channel.id
    ) {
      logChannel.send({
        embeds: [
          {
            title: "🔄 Voice Channel Moved",
            description: `${newState.member} was moved from ${oldState.channel} to ${newState.channel}`,
            color: 0x00ffff,
            timestamp: new Date(),
          },
        ],
      });
    }
  },
};
