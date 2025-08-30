const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    // 🔹 ID القناة اللي هيتبعت فيها الويلكم
    const channelId = "1188637577285226577";
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    // 🔹 هنا بنجيب القنوات اللي هنذكرها
    const serverIntro = "<#1214035383814455348>";
    const rolesChannel = "<#1368825792401903636>";
    const mainChat = "<#1188637577423618101>";

    // 🔹 نص الترحيب
    const description = `
**Welcome ⸜(｡˃ ᵕ ˂ )⸝♡**

ฅ^._.^ฅ *. ⋆ Welcome ${member} to **${member.guild.name}** !
·˚ ༘ Hope you have fun and enjoy ꒱ ‧₊˚
⋆｡ ˚︵‿︵‿︵‿୨♡୧‿︵‿︵‿︵‿︵ ˚｡⋆
Grab a coffee and ☕

★ Visit these Channels ★
🍩 ${serverIntro} ・ Server Intro
🍢 ${rolesChannel} ・ Roles
🍰 ${mainChat} ・ Main Chat
`;

    // 🔹 Embed
    const embed = new EmbedBuilder()
      .setColor(0xf7c8e0)
      .setDescription(description)
      .setImage(
        "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGxhNGVwYjQ5dG5xcjhrN3NidzRvYmRhdHZ0a3pqcTFpZ2tlc3hhbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mTz4WC3NmAxaTqSxxu/giphy.gif" // غيرها بالـ GIF اللي تحبه
      )
      .setFooter({ text: "We're glad you joined 💕" });

    // 🔹 إرسال الويلكم
    channel.send({ embeds: [embed] });
  },
};
