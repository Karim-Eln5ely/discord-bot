const cron = require("cron");
const fetch = require("node-fetch");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const PrayerSettings = require("../db/models/prayer.js");

module.exports = (client) => {
  console.log("PrayerUtils initialized");

  // جدولة فورية للاختبار
  const job = new cron.CronJob(
    "0 0 * * *", // كل يوم الساعه 12 
    async () => {
      console.log(
        "CronJob triggered at",
        new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      );
      const guilds = await PrayerSettings.find({});
      console.log("Loaded prayer settings:", guilds);

      if (guilds.length === 0) {
        console.log("No prayer settings found in database");
        return;
      }

      for (const settings of guilds) {
        const guild = client.guilds.cache.get(settings.guildId);
        if (!guild) {
          console.log(`Guild ${settings.guildId} not found`);
          continue;
        }
        console.log(`Processing guild ${guild.id} with settings:`, settings);

        const response = await fetch(
          `http://api.aladhan.com/v1/timingsByCity?city=${settings.city}&country=${settings.country}&method=5`
        );
        const data = await response.json();
        if (!data.data) {
          console.error(
            `Failed to fetch prayer times for ${settings.city}, ${settings.country}`
          );
          continue;
        }

        const timings = data.data.timings;
        console.log(
          `Prayer times for ${settings.city}, ${settings.country}:`,
          timings
        );

        const prayers = [
          { name: "الفجر", time: timings.Fajr },
          { name: "الظهر", time: timings.Dhuhr },
          { name: "العصر", time: timings.Asr },
          { name: "المغرب", time: timings.Maghrib },
          { name: "العشاء", time: timings.Isha },
        ];
        console.log("Scheduled prayers:", prayers);

        prayers.forEach((prayer) => {
          const [hours, minutes] = prayer.time.split(":").map(Number);
          const prayerTime = new Date();
          prayerTime.setHours(hours, minutes, 0, 0);
          console.log(
            `Scheduling ${prayer.name} at ${prayerTime.toLocaleString("en-US", {
              timeZone: "Africa/Cairo",
            })}`
          );

          const timeoutMs = prayerTime - Date.now();
          console.log(`Timeout for ${prayer.name}: ${timeoutMs}ms`);

          if (timeoutMs > 0) {
            setTimeout(
              () => announcePrayer(guild, settings, prayer.name),
              timeoutMs
            );
          } else {
            console.log(`Prayer ${prayer.name} time has already passed`);
          }
        });
      }
    },
    null,
    true,
    "Africa/Cairo"
  );
  job.start();
  console.log("CronJob started");
};

async function announcePrayer(guild, settings, prayerName) {
  console.log(`Announcing prayer ${prayerName} for guild ${guild.id}`);
  const channel = guild.channels.cache.get(settings.announcementChannelId);
  if (!channel) {
    console.error(
      `Announcement channel ${settings.announcementChannelId} not found in guild ${guild.id}`
    );
    return;
  }
  console.log(`Channel found: ${channel.name} (ID: ${channel.id})`);

  // إعلان في الروم
  console.log(`Sending announcement to channel ${channel.id}`);
  try {
    await channel.send(
      `<@&${settings.prayerRoleId}> - وقت صلاة ${prayerName}!`
    );
    console.log(`Announcement sent successfully for ${prayerName}`);
  } catch (error) {
    console.error(
      `Failed to send announcement to channel ${channel.id}:`,
      error
    );
    return;
  }

  // العثور على أكثر Voice Channel ناس
  const voiceChannels = guild.channels.cache.filter(
    (c) => c.type === 2 && c.members.size > 0
  ); // GUILD_VOICE = 2
  if (voiceChannels.size === 0) {
    console.log(`No active voice channels in guild ${guild.id}`);
    return;
  }

  const mostPopulatedVoice = voiceChannels
    .sort((a, b) => b.members.size - a.members.size)
    .first();
  console.log(
    `Joining voice channel ${mostPopulatedVoice.id} with ${mostPopulatedVoice.members.size} members`
  );

  // الدخول للـ Voice وتشغيل الآذان من رابط MP3
  let connection;
  try {
    connection = joinVoiceChannel({
      channelId: mostPopulatedVoice.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    console.log(`Connected to voice channel ${mostPopulatedVoice.id}`);

    const player = createAudioPlayer();
    const resource = createAudioResource(
      "https://islamcan.com/audio/adhan/azan9.mp3"
    );

    player.play(resource);
    connection.subscribe(player);
    console.log(`Playing adhan in voice channel ${mostPopulatedVoice.id}`);

    player.on(AudioPlayerStatus.Idle, () => {
      console.log(
        `Adhan finished, leaving voice channel ${mostPopulatedVoice.id}`
      );
      if (connection && connection.state.status !== "destroyed") {
        connection.destroy();
      }
    });

    player.on("error", (error) => {
      console.error(`Error playing adhan in guild ${guild.id}:`, error);
      if (connection && connection.state.status !== "destroyed") {
        connection.destroy();
      }
    });
  } catch (error) {
    console.error(
      `Error joining voice channel or playing adhan in guild ${guild.id}:`,
      error
    );
    if (connection && connection.state.status !== "destroyed") {
      connection.destroy();
    }
  }
}
