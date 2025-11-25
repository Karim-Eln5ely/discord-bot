const cron = require("cron");
const fetch = require("node-fetch");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { EmbedBuilder } = require("@discordjs/builders");
const PrayerSettings = require("../db/models/prayer.js");

const cronJobs = new Map(); // لتخزين الـ CronJobs

module.exports = (client) => {
  console.log("PrayerUtils initialized");

  // وظيفة لجدولة الصلوات
  async function schedulePrayers() {
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

      // وقف الـ CronJobs القديمة لهذا الـ guild
      const guildCronKey = settings.guildId;
      if (cronJobs.has(guildCronKey)) {
        const jobs = cronJobs.get(guildCronKey);
        for (const job of jobs) {
          job.stop();
          console.log(`Stopped old CronJob for guild ${guild.id}`);
        }
        cronJobs.delete(guildCronKey);
      }

      // إنشاء CronJobs جديدة
      const newJobs = [];
      prayers.forEach((prayer) => {
        const [hours, minutes] = prayer.time.split(":").map(Number);
        const cronTime = `${minutes} ${hours} * * *`;
        const job = new cron.CronJob(
          cronTime,
          () => announcePrayer(guild, settings, prayer.name, prayer.time),
          null,
          true,
          "Africa/Cairo"
        );
        job.start();
        newJobs.push(job);
        console.log(
          `Scheduled ${prayer.name} at ${hours}:${minutes} for guild ${guild.id}`
        );
      });

      // تخزين الـ CronJobs الجديدة
      cronJobs.set(guildCronKey, newJobs);
    }
  }

  // تشغيل الجدولة عند بدء البوت
  schedulePrayers();

  // إعادة جدولة الصلوات يوميًا عند منتصف الليل
  const dailyJob = new cron.CronJob(
    "0 0 0 * * *",
    schedulePrayers,
    null,
    true,
    "Africa/Cairo"
  );
  dailyJob.start();
  console.log("Daily prayer scheduling job started");
};

async function announcePrayer(guild, settings, prayerName, prayerTime) {
  console.log(
    `Attempting to announce ${prayerName} for guild ${guild.id} at ${new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })}`
  );
  const channel = guild.channels.cache.get(settings.announcementChannelId);
  if (!channel) {
    console.error(
      `Announcement channel ${settings.announcementChannelId} not found in guild ${guild.id}`
    );
    return;
  }
  console.log(`Channel found: ${channel.name} (ID: ${channel.id})`);

  // إنشاء Embed للإعلان
  const prayerEmbed = new EmbedBuilder()
    .setColor(0x1E90FF) // لون أزرق لطيف
    .setTitle(`وقت صلاة ${prayerName}`)
    .setDescription(
      `<@&${settings.prayerRoleId}> - حان وقت صلاة **${prayerName}**!\n**الوقت**: ${prayerTime}\nقم للصلاة ولا تنسَ أجرها العظيم 🕌`
    )
    .setThumbnail("https://i.top4top.io/p_3536eb8wv1.png")
    .setTimestamp()
    .setFooter({ text: "فَأَقِيمُوا الصَّلَاةَ ۚ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا" });

  // إعلان في الروم
  try {
    await channel.send({ embeds: [prayerEmbed] });
    console.log(
      `Announcement sent successfully for ${prayerName} at ${new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })}`
    );
  } catch (error) {
    console.error(`Failed to send announcement for ${prayerName} to channel ${channel.id}:`, error);
    return;
  }

  // العثور على أكثر Voice Channel ناس
  const voiceChannels = guild.channels.cache.filter(
    (c) => c.type === 2 && c.members.size > 0
  );
  if (voiceChannels.size === 0) {
    console.log(`No active voice channels in guild ${guild.id} for ${prayerName}`);
    return;
  }
  const mostPopulatedVoice = voiceChannels
    .sort((a, b) => b.members.size - a.members.size)
    .first();
  console.log(
    `Joining voice channel ${mostPopulatedVoice.id} with ${mostPopulatedVoice.members.size} members for ${prayerName}`
  );

  let connection;
  try {
    connection = joinVoiceChannel({
      channelId: mostPopulatedVoice.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    console.log(`Connected to voice channel ${mostPopulatedVoice.id} for ${prayerName}`);
    const player = createAudioPlayer();
    const resource = createAudioResource(
      "https://islamcan.com/audio/adhan/azan9.mp3"
    );
    player.play(resource);
    connection.subscribe(player);
    console.log(`Playing adhan in voice channel ${mostPopulatedVoice.id} for ${prayerName}`);
    player.on(AudioPlayerStatus.Idle, () => {
      console.log(
        `Adhan finished for ${prayerName}, leaving voice channel ${mostPopulatedVoice.id}`
      );
      if (connection && connection.state.status !== "destroyed") {
        connection.destroy();
      }
    });
    player.on("error", (error) => {
      console.error(`Error playing adhan for ${prayerName} in guild ${guild.id}:`, error);
      if (connection && connection.state.status !== "destroyed") {
        connection.destroy();
      }
    });
  } catch (error) {
    console.error(
      `Error joining voice channel or playing adhan for ${prayerName} in guild ${guild.id}:`,
      error
    );
    if (connection && connection.state.status !== "destroyed") {
      connection.destroy();
    }
  }
}