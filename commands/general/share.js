// commands/share.js
const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("share")
    .setDescription("شارك أي ريل إنستا أو تيك توك كفيديو حقيقي")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("لينك الريل أو التيك توك")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const link = interaction.options.getString("link").trim();
    let videoUrl = null;

    // ============================
    //      INSTAGRAM (EMBED)
    // ============================
    if (link.includes("instagram.com")) {
      try {
        const embed = `${link}?__a=1&__d=dis`;
        const res = await axios.get(embed, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        // Instagram keep changing these keys
        videoUrl =
          res.data?.items?.[0]?.video_versions?.[0]?.url ||
          res.data?.graphql?.shortcode_media?.video_url;
      } catch (err) {
        console.log("Embed fetch failed:", err?.response?.status);
      }
    }

    // ============================
    //          TIKTOK
    // ============================
    else if (link.includes("tiktok.com") || link.includes("vm.tiktok.com")) {
      try {
        const res = await axios.get(
          `https://api.tiklydown.eu.org/api/download?link=${encodeURIComponent(
            link
          )}`
        );
        videoUrl = res.data.video?.noWatermark || res.data.video?.hd;
      } catch (err) {
        console.log("TikTok failed:", err);
      }
    }

    if (!videoUrl) {
      return interaction.editReply({
        content: "اللينك ده مش شغال دلوقتي 😔\nبس اتأكد إنه public.",
      });
    }

    await interaction.deleteReply();

    await interaction.channel
      .send({
        content: " ",
        files: [{ attachment: videoUrl, name: "reel.mp4" }],
      })
      .catch(() => {
        interaction.channel.send({
          content: "الفيديو كبير أوي، خد اللينك ده:\n" + videoUrl,
        });
      });
  },
};
