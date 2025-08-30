module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    const logChannel = newMember.guild.channels.cache.find(
      (ch) => ch.name === "admin-logs"
    );
    if (!logChannel) return;

    // timeout/mute
    if (
      oldMember.communicationDisabledUntil !==
      newMember.communicationDisabledUntil
    ) {
      logChannel.send({
        embeds: [
          {
            title: "🔇 Timeout Updated",
            description: `${newMember} got timeout until ${newMember.communicationDisabledUntil}`,
            color: 0xffff00,
            timestamp: new Date(),
          },
        ],
      });
    }

    // role changes (mute/unmute)
    const oldRoles = oldMember.roles.cache.map((r) => r.id);
    const newRoles = newMember.roles.cache.map((r) => r.id);
    const addedRoles = newRoles.filter((r) => !oldRoles.includes(r));
    const removedRoles = oldRoles.filter((r) => !newRoles.includes(r));

    if (addedRoles.length || removedRoles.length) {
      logChannel.send({
        embeds: [
          {
            title: "🛡️ Role Changes",
            description: `${newMember}`,
            fields: [
              {
                name: "Added Roles",
                value: addedRoles.length
                  ? addedRoles.map((r) => `<@&${r}>`).join(", ")
                  : "None",
              },
              {
                name: "Removed Roles",
                value: removedRoles.length
                  ? removedRoles.map((r) => `<@&${r}>`).join(", ")
                  : "None",
              },
            ],
            color: 0x00ffff,
            timestamp: new Date(),
          },
        ],
      });
    }
  },
};
