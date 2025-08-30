module.exports = {
  name: "userUpdate",
  async execute(oldUser, newUser, client) {
    client.guilds.cache.forEach((guild) => {
      const logChannel = guild.channels.cache.find(
        (ch) => ch.name === "profile-logs"
      );
      if (!logChannel) return;

      // username change
      if (oldUser.username !== newUser.username) {
        logChannel.send({
          embeds: [
            {
              title: "✏️ Username Updated",
              description: `${oldUser.tag} changed their username`,
              fields: [
                { name: "Before", value: oldUser.username, inline: true },
                { name: "After", value: newUser.username, inline: true },
              ],
              color: 0xffff00,
              timestamp: new Date(),
            },
          ],
        });
      }

      // avatar change
      if (
        oldUser.displayAvatarURL({ dynamic: true }) !==
        newUser.displayAvatarURL({ dynamic: true })
      ) {
        logChannel.send({
          embeds: [
            {
              title: "🖼️ Avatar Updated",
              description: `${oldUser.tag} changed their avatar`,
              image: { url: newUser.displayAvatarURL({ dynamic: true }) },
              color: 0xffff00,
              timestamp: new Date(),
            },
          ],
        });
      }
    });
  },
};
