module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // تعيين الحالة (presence)
    client.user.setPresence({
      activities: [{ name: "Managing the server 💻", type: 0 }], // type 0 = Playing
      status: "online", // "online" | "idle" | "dnd" | "invisible"
    });
  },
};
