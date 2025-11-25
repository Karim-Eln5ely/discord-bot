const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");

const {
  activeGames,
  playerSelections,
  ROLES,
  ROLE_DESCRIPTIONS,
} = require("../utils/mafiaState");


// ====== IDs ======
const ticketCategoryId = "1411375711066788021"; // كاتيجوري التيكتات
const ticketLogsId = "1411376005268111512"; // روم اللوجز
const gameChannelId = "1413212018562830516"; // غيّر ده بـ ID روم اللعبة الفعلي
module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // ===== Slash Commands =====
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        const reply = {
          content: "❌ حصل خطأ وانت بتنّفذ الأمر!",
          flags: MessageFlags.Ephemeral,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
      return;
    }
    // ===== Tickets =====
    if (interaction.isButton() && interaction.customId.includes("ticket")) {
      const logChannel = interaction.guild.channels.cache.get(ticketLogsId);
      const member = interaction.user;
      // استخراج owner ID من topic الروم
      function getOwnerId(channel) {
        if (!channel.topic) return null;
        const match = channel.topic.match(/Owner ID: (\d+)/);
        return match ? match[1] : null; // نرجع الـ ID كـ string
      }
      // ---------- Create Ticket ----------
      if (interaction.customId === "create_ticket") {
        // تحقق من وجود تيكت موجود (مفتوح أو مغلق)
        const existingChannel = interaction.guild.channels.cache.find(
          (c) =>
            c.parentId === ticketCategoryId &&
            c.topic &&
            getOwnerId(c) === member.id
        );
        if (existingChannel) {
          return interaction.reply({
            content: `❌ لديك تيكت موجود بالفعل: <#${existingChannel.id}>. إذا كان مغلقًا، اطلب من الستاف إعادة فتحه أو احذفه لإنشاء واحد جديد.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        try {
          const randomNum = Math.floor(Math.random() * 100);
          const channelName = `ticket-${member.username.slice(
            0,
            5
          )}-${randomNum}`;
          const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategoryId,
            topic: `Owner ID: ${member.id}`, // حفظ ID المالك في الـ topic
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: member.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
            ],
          });
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("close_ticket")
              .setLabel("Close Ticket")
              .setStyle(ButtonStyle.Danger)
          );
          const ticketEmbed = new EmbedBuilder()
            .setTitle("🎫 Ticket")
            .setDescription(
              `Hello ${member}, describe your issue and our staff will help you soon.`
            )
            .setColor(0x00ff00)
            .setTimestamp();
          await channel.send({
            content: `<@${member.id}>`,
            embeds: [ticketEmbed],
            components: [row],
          });
          // Log
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("📩 Ticket Opened")
              .addFields(
                { name: "User", value: `${member}`, inline: true },
                { name: "Channel", value: `<#${channel.id}>`, inline: true },
                {
                  name: "Opened At",
                  value: `<t:${Math.floor(Date.now() / 1000)}>`,
                }
              )
              .setColor(0x00ffff)
              .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
          }
          // رد ephemeral خاص باليوزر فقط (مش بيعدل الرسالة الأصلية عشان الزر يفضل للآخرين)
          return interaction.reply({
            content: `✅ تم إنشاء التيكت الخاص بك: <#${channel.id}>`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error creating ticket:", error);
          return interaction.reply({
            content:
              "❌ Failed to create ticket. Please check bot permissions or category ID.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      // ---------- Close Ticket ----------
      if (interaction.customId === "close_ticket") {
        const channel = interaction.channel;
        const ownerId = getOwnerId(channel);
        // تحقق من صلاحيات المستخدم
        if (
          ownerId !== member.id &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        ) {
          return interaction.reply({
            content: "❌ You cannot close this ticket.",
            flags: MessageFlags.Ephemeral,
          });
        }
        // إذا كان ownerId غير موجود، منع الإغلاق إلا لو الستاف
        if (
          !ownerId &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        ) {
          return interaction.reply({
            content:
              "❌ Cannot close ticket: Owner ID not found in channel topic.",
            flags: MessageFlags.Ephemeral,
          });
        }
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("reopen_ticket")
            .setLabel("Reopen Ticket")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("delete_ticket")
            .setLabel("Delete Ticket")
            .setStyle(ButtonStyle.Danger)
        );
        const embed = new EmbedBuilder()
          .setTitle("🔒 Ticket Closed")
          .setDescription(`This ticket has been closed by ${member}.`)
          .setColor(0xffcc00)
          .setTimestamp();
        try {
          // تحديث الـ permissions
          const permissionOverwrites = [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
              ],
            },
          ];
          // إضافة permissions المالك فقط إذا كان ownerId موجود
          if (ownerId) {
            // تحقق من وجود المستخدم في الـ cache
            const ownerMember = await interaction.guild.members
              .fetch(ownerId)
              .catch(() => null);
            if (ownerMember) {
              permissionOverwrites.push({
                id: ownerId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
                deny: [
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.AddReactions,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.EmbedLinks,
                  PermissionFlagsBits.UseApplicationCommands,
                ],
              });
            } else {
              console.warn(`Owner ID ${ownerId} not found in guild cache.`);
            }
          }
          await channel.permissionOverwrites.set(permissionOverwrites);
          // تحديث الرسالة الأصلية (اللي فيها زر Close) إلى رسالة Closed مع أزرار Reopen و Delete
          await interaction.update({ embeds: [embed], components: [row] });
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("🔒 Ticket Closed")
              .addFields(
                { name: "User", value: `${member}`, inline: true },
                { name: "Channel", value: `<#${channel.id}>`, inline: true },
                {
                  name: "Closed At",
                  value: `<t:${Math.floor(Date.now() / 1000)}>`,
                }
              )
              .setColor(0xffcc00)
              .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
          }
          // رد ephemeral إضافي للتأكيد (اختياري)
          await interaction.followUp({
            content: "✅ Ticket closed.",
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error closing ticket:", error);
          return interaction.reply({
            content: "❌ Failed to close ticket due to permission error.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      // ---------- Reopen Ticket ----------
      if (interaction.customId === "reopen_ticket") {
        const channel = interaction.channel;
        const ownerId = getOwnerId(channel);
        if (
          ownerId !== member.id &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        ) {
          return interaction.reply({
            content: "❌ You cannot reopen this ticket.",
            flags: MessageFlags.Ephemeral,
          });
        }
        // إذا كان ownerId غير موجود، منع إعادة الفتح إلا لو الستاف
        if (
          !ownerId &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        ) {
          return interaction.reply({
            content:
              "❌ Cannot reopen ticket: Owner ID not found in channel topic.",
            flags: MessageFlags.Ephemeral,
          });
        }
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Danger)
        );
        const embed = new EmbedBuilder()
          .setTitle("✅ Ticket Reopened")
          .setDescription(`This ticket has been reopened by ${member}.`)
          .setColor(0x00ff00)
          .setTimestamp();
        try {
          if (ownerId) {
            // تحقق من وجود المستخدم في الـ cache
            const ownerMember = await interaction.guild.members
              .fetch(ownerId)
              .catch(() => null);
            if (ownerMember) {
              await channel.permissionOverwrites.edit(ownerId, {
                SendMessages: true,
                AddReactions: null,
                AttachFiles: null,
                EmbedLinks: null,
                UseApplicationCommands: null,
              });
            } else {
              console.warn(
                `Owner ID ${ownerId} not found in guild cache for reopen.`
              );
            }
          }
          // تحديث الرسالة الأصلية (اللي فيها Reopen و Delete) إلى رسالة Reopened مع زر Close
          await interaction.update({ embeds: [embed], components: [row] });
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("✅ Ticket Reopened")
              .addFields(
                { name: "User", value: `${member}`, inline: true },
                { name: "Channel", value: `<#${channel.id}>`, inline: true },
                {
                  name: "Reopened At",
                  value: `<t:${Math.floor(Date.now() / 1000)}>`,
                }
              )
              .setColor(0x00ff00)
              .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
          }
          // رد ephemeral إضافي للتأكيد (اختياري)
          await interaction.followUp({
            content: "✅ Ticket reopened.",
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error reopening ticket:", error);
          return interaction.reply({
            content: "❌ Failed to reopen ticket due to permission error.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      // ---------- Delete Ticket ----------
      if (interaction.customId === "delete_ticket") {
        const channel = interaction.channel;
        const ownerId = getOwnerId(channel);
        if (
          ownerId !== member.id &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        ) {
          return interaction.reply({
            content: "❌ You cannot delete this ticket.",
            flags: MessageFlags.Ephemeral,
          });
        }
        await interaction.reply({
          content: "✅ Deleting ticket... Please wait.",
          flags: MessageFlags.Ephemeral,
        });
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          const logText = messages
            .map(
              (m) => `[${m.author.tag}]: ${m.content || "[Embed/Attachment]"}`
            )
            .reverse()
            .join("\n");
          if (logChannel && logText.length > 0) {
            const logEmbed = new EmbedBuilder()
              .setTitle("📜 Ticket Transcript")
              .addFields(
                { name: "Channel", value: `<#${channel.id}>`, inline: true },
                { name: "Transcript", value: logText.substring(0, 1024) }
              )
              .setColor(0x0000ff)
              .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
          }
          await channel.delete();
        } catch (error) {
          console.error("Error deleting ticket:", error);
          await interaction.editReply({
            content:
              "❌ Failed to delete ticket. Please try again or contact an admin.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      return;
    }

    // ===== Mafia Game =====
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      let game;
      let channelId;

      // استخراج channelId من customId للاختيارات في DM
      if (interaction.customId.startsWith("sheriff_investigate_")) {
        channelId = interaction.customId.split("_")[2];
        game = activeGames.get(channelId);
      } else if (interaction.customId.startsWith("doctor_heal_")) {
        channelId = interaction.customId.split("_")[2];
        game = activeGames.get(channelId);
      } else if (interaction.customId.startsWith("mafia_kill_")) {
        channelId = interaction.customId.split("_")[2];
        game = activeGames.get(channelId);
      } else {
        // للأزرار في القناة العامة
        channelId = interaction.channel.id;
        game = activeGames.get(channelId);
      }

      // لو اللعبة مش شغالة
      if (!game && interaction.customId.includes("mafia")) {
        return interaction.reply({
          content: "لا توجد لعبة نشطة في هذه القناة!",
          ephemeral: true,
        });
      }

      // --- أزرار اللوبي ---
      if (interaction.customId === "join_mafia") {
        if (game.players.includes(interaction.user.id)) {
          return interaction.reply({
            content: "أنت منضم بالفعل!",
            ephemeral: true,
          });
        }
        if (game.players.length >= 15) {
          return interaction.reply({
            content: "اللعبة ممتلئة (15/15)!",
            ephemeral: true,
          });
        }
        game.players.push(interaction.user.id);
        const embed = updateGameEmbed(game, client);
        return interaction.update({ embeds: [embed] });
      }

      if (interaction.customId === "leave_mafia") {
        if (!game.players.includes(interaction.user.id)) {
          return interaction.reply({
            content: "أنت لست في اللعبة!",
            ephemeral: true,
          });
        }
        game.players = game.players.filter((id) => id !== interaction.user.id);
        const embed = updateGameEmbed(game, client);
        return interaction.update({ embeds: [embed] });
      }

      if (interaction.customId === "start_mafia") {
        if (game.players.length < 5) {
          return interaction.reply({
            content: "مطلوب 5 لاعبين على الأقل!",
            ephemeral: true,
          });
        }

        await interaction.deferUpdate();

        // تهيئة اللعبة
        game.alivePlayers = [...game.players];
        game.roles = new Map();
        game.nightActions = new Map();
        game.votes = new Map();
        game.phase = "night";
        game.round = 1;

        // توزيع الأدوار
        const roles = assignRoles(game.players);
        console.log("Start sending roles:", Date.now());
        await Promise.all(
          game.players.map((playerId, index) => {
            game.roles.set(playerId, roles[index]);
            return sendRoleToPlayer(client, playerId, roles[index]);
          })
        );
        console.log("Finished sending roles:", Date.now());

        // تحديث الرسالة بعد إرسال الأدوار
        await interaction.editReply({
          content: "🎮 بدأت اللعبة! تم إرسال الأدوار في الخاص.",
          embeds: [],
          components: [],
        });

        // عرض معلومات اللاعبين الأحياء
        const channel = interaction.channel;
        await channel.send({
          embeds: [createAlivePlayersEmbed(game, client)],
        });

        setTimeout(() => startNightPhase(game, client), 3000);
      }

      // --- أدوار الليل ---
      if (interaction.customId.startsWith("sheriff_investigate_")) {
        await handleSheriff(interaction, client, game);
      }
      if (interaction.customId.startsWith("doctor_heal_")) {
        await handleDoctor(interaction, client, game);
      }
      if (interaction.customId.startsWith("mafia_kill_")) {
        await handleMafia(interaction, client, game);
      }

      // --- التصويت ---
      if (interaction.customId === "vote_player") {
        await handleVote(interaction, client, game);
      }
    }

    // ===== نظام موافقة الأدمن على دخول روم صوتي (Waiting Room) =====
    if (interaction.isButton() && (interaction.customId.startsWith("admin_approve_") || interaction.customId.startsWith("admin_decline_"))) {
      if (!interaction.member?.permissions.has("Administrator")) {
        return interaction.reply({ content: "فقط الأدمن يقدروا يستخدموا الأزرار دي!", ephemeral: true });
      }

      const action = interaction.customId.startsWith("admin_approve_") ? "approve" : "decline";
      const targetId = interaction.customId.split("_")[2];
      const targetMember = interaction.guild.members.cache.get(targetId);

      if (!targetMember) {
        return interaction.reply({ content: "العضو مش موجود في السيرفر دلوقتي.", ephemeral: true });
      }

      if (!targetMember.voice?.channel) {
        return interaction.reply({ content: "العضو مش متصل بأي روم صوتي حاليًا.", ephemeral: true });
      }

      try {
        if (action === "approve") {
          // غيّر الـ ID ده للروم الصوتي اللي عايز تنقلهم فيه
          const adminVoiceChannelId = "1361338723236839614"; 
          const adminVoiceChannel = interaction.guild.channels.cache.get(adminVoiceChannelId);

          if (!adminVoiceChannel) {
            return interaction.reply({ content: "روم الأدمن الصوتي مش موجود! تأكد من الـ ID.", ephemeral: true });
          }

          await targetMember.voice.setChannel(adminVoiceChannel);
          await interaction.reply({ content: `${targetMember} تم نقله إلى روم الأدمن بنجاح!`, ephemeral: false });
        } else {
          await targetMember.voice.disconnect();
          await interaction.reply({ content: `${targetMember} تم رفضه وفصله من الروم الصوتي.`, ephemeral: false });
        }

        // تعديل الرسالة الأصلية بعد الضغط على الزر
        if (interaction.message.embeds[0]) {
          const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(action === "approve" ? "#00ff00" : "#ff0000")
            .setFooter({ text: `تمت المعالجة بواسطة ${interaction.user.tag}` })
            .setTimestamp();

          await interaction.message.edit({ embeds: [newEmbed], components: [] });
        }
      } catch (error) {
        console.error("خطأ في نظام Waiting Room:", error);
        await interaction.reply({ content: "حصل خطأ أثناء النقل أو الفصل!", ephemeral: true });
      }

      return;
    }
  },
};

// =============== Mafia Functions ===============

function assignRoles(players) {
  const roles = [];
  const mafiaCount = players.length >= 7 ? 2 : 1;
  roles.push(...Array(mafiaCount).fill(ROLES.MAFIA));
  roles.push(ROLES.SHERIFF);
  roles.push(ROLES.DOCTOR);
  while (roles.length < players.length) roles.push(ROLES.CITIZEN);
  return shuffleArray(roles);
}

async function sendRoleToPlayer(client, playerId, role) {
  try {
    const user = await client.users.fetch(playerId);
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🎭 دورك: ${role}`)
          .setDescription(ROLE_DESCRIPTIONS[role])
          .setColor(role === ROLES.MAFIA ? 0xff0000 : 0x00ff00),
      ],
    });
  } catch (error) {
    console.error(`فشل في إرسال الرسالة لـ ${playerId}:`, error);
  }
}

function updateGameEmbed(game, client) {
  const names = game.players.map((id, index) => {
    const user = client.users.cache.get(id);
    return `${index + 1}. ${user ? user.username : "مجهول"}`;
  });
  return new EmbedBuilder()
    .setTitle("🎮 لعبة Mafia")
    .setDescription(
      `👥 اللاعبين (${game.players.length}/15):\n${
        names.join("\n") || "لا يوجد لاعبين"
      }`
    )
    .setColor("Random")
    .setFooter({ text: "يحتاج 5 لاعبين على الأقل للبدء" });
}

function createAlivePlayersEmbed(game, client) {
  const aliveNames = game.alivePlayers.map((id, index) => {
    const user = client.users.cache.get(id);
    return `${index + 1}. ${user ? user.username : "مجهول"}`;
  });

  return new EmbedBuilder()
    .setTitle(`🌙 الليلة ${game.round}`)
    .setDescription(
      `👥 اللاعبين الأحياء (${game.alivePlayers.length}):\n${aliveNames.join(
        "\n"
      )}`
    )
    .setColor("#2C2F33");
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

async function startNightPhase(game, client) {
  const channel = await client.channels.fetch(game.channelId);
  if (!channel) return;

  game.phase = "night";
  game.nightActions.clear(); // تنظيف إجراءات الليلة السابقة

  await channel.send("🌙 بدأت ليلة جديدة! كل الأدوار تبدأ بالتحرك...");

  // بدء دور الشيرف
  await sheriffTurn(game, client, channel);
}

// ===== Sheriff Turn =====
async function sheriffTurn(game, client, channel) {
  const sheriffId = [...game.roles.entries()].find(
    ([id, role]) => role === ROLES.SHERIFF && game.alivePlayers.includes(id)
  )?.[0];

  if (!sheriffId) {
    await channel.send("🕵️ **الشيرف ميت** - يتم تخطي دوره...");
    return setTimeout(() => doctorTurn(game, client, channel), 2000);
  }

  const sheriff = await client.users.fetch(sheriffId);
  const aliveOthers = game.alivePlayers.filter((id) => id !== sheriffId);

  if (aliveOthers.length === 0) return doctorTurn(game, client, channel);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`sheriff_investigate_${game.channelId}`)
    .setPlaceholder("اختر شخص للتحقيق")
    .addOptions(
      aliveOthers.map((id) => ({
        label: client.users.cache.get(id)?.username || "Unknown",
        value: id,
      }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  try {
    await sheriff.send({
      content: "🕵️ **اختر شخص للتحقيق معه:** (لديك 60 ثانية)",
      components: [row],
    });
    await channel.send("🕵️ **دور الشيرف** جاري...");
  } catch (error) {
    await channel.send("🕵️ **خطأ في التواصل مع الشيرف** - يتم تخطي دوره...");
    setTimeout(() => doctorTurn(game, client, channel), 2000);
  }

  // تايمر للشيرف
  setTimeout(() => {
    if (!game.nightActions.has("sheriff_investigate")) {
      doctorTurn(game, client, channel);
    }
  }, 60000); // دقيقة واحدة
}

// ===== Doctor Turn =====
async function doctorTurn(game, client, channel) {
  const doctorId = [...game.roles.entries()].find(
    ([id, role]) => role === ROLES.DOCTOR && game.alivePlayers.includes(id)
  )?.[0];

  if (!doctorId) {
    await channel.send("⚕️ **الطبيب ميت** - يتم تخطي دوره...");
    return setTimeout(() => mafiaTurn(game, client, channel), 2000);
  }

  const doctor = await client.users.fetch(doctorId);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`doctor_heal_${game.channelId}`)
    .setPlaceholder("اختر شخص لتحميه")
    .addOptions(
      game.alivePlayers.map((id) => ({
        label: client.users.cache.get(id)?.username || "Unknown",
        value: id,
      }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  try {
    await doctor.send({
      content: "⚕️ **اختر شخص لتحميه:** (لديك 60 ثانية)",
      components: [row],
    });
    await channel.send("⚕️ **دور الطبيب** جاري...");
  } catch (error) {
    await channel.send("⚕️ **خطأ في التواصل مع الطبيب** - يتم تخطي دوره...");
    setTimeout(() => mafiaTurn(game, client, channel), 2000);
  }

  // تايمر للطبيب
  setTimeout(() => {
    if (!game.nightActions.has("doctor_heal")) {
      mafiaTurn(game, client, channel);
    }
  }, 60000);
}

// ===== Mafia Turn =====
async function mafiaTurn(game, client, channel) {
  const mafiaPlayers = [...game.roles.entries()]
    .filter(
      ([id, role]) => role === ROLES.MAFIA && game.alivePlayers.includes(id)
    )
    .map(([id]) => id);

  if (mafiaPlayers.length === 0) {
    await channel.send("🔪 **كل المافيا ماتوا** - يتم تخطي دورهم...");
    return setTimeout(() => startDayPhase(game, client), 2000);
  }

  const mafia = await client.users.fetch(mafiaPlayers[0]);
  const others = game.alivePlayers.filter((id) => !mafiaPlayers.includes(id));

  if (others.length === 0) return startDayPhase(game, client);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`mafia_kill_${game.channelId}`)
    .setPlaceholder("اختر ضحية")
    .addOptions(
      others.map((id) => ({
        label: client.users.cache.get(id)?.username || "Unknown",
        value: id,
      }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  try {
    await mafia.send({
      content: "🔪 **اختر شخص لتقتله:** (لديك 60 ثانية)",
      components: [row],
    });
    await channel.send("🔪 **دور المافيا** جاري...");
  } catch (error) {
    await channel.send("🔪 **خطأ في التواصل مع المافيا** - يتم تخطي دورهم...");
    setTimeout(() => startDayPhase(game, client), 2000);
  }

  // تايمر للمافيا
  setTimeout(() => {
    if (!game.nightActions.has("mafia_kill")) {
      startDayPhase(game, client);
    }
  }, 60000);
}

// ===== Day Phase =====
async function startDayPhase(game, client) {
  const channel = await client.channels.fetch(game.channelId);
  if (!channel) return;

  game.phase = "day";

  const killed = game.nightActions.get("mafia_kill");
  const healed = game.nightActions.get("doctor_heal");

  if (killed && killed !== healed) {
    game.alivePlayers = game.alivePlayers.filter((id) => id !== killed);
    game.deadPlayers.push(killed);
    const killedUser = client.users.cache.get(killed);
    const killedRole = game.roles.get(killed);
    await channel.send(
      `💀 **${
        killedUser?.username || "مجهول"
      }** مات البارحة! كان **${killedRole}**`
    );
  } else if (killed && killed === healed) {
    await channel.send(`✅ تم إنقاذ شخص البارحة!`);
  } else {
    await channel.send("✅ محدش مات البارحة!");
  }

  // فحص شروط الفوز
  const checkResult = checkWinConditions(game, client);
  if (checkResult) {
    await channel.send({ embeds: [checkResult] });
    activeGames.delete(game.channelId);
    return;
  }

  // عرض اللاعبين الأحياء
  await channel.send({
    embeds: [createAlivePlayersEmbed(game, client)],
  });

  await startVoting(game, client, channel);
}

// ===== Voting =====
async function startVoting(game, client, channel) {
  game.phase = "voting";
  game.votes.clear();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("vote_player")
    .setPlaceholder("اختر شخص للتصويت ضده")
    .addOptions(
      game.alivePlayers.map((id) => ({
        label: client.users.cache.get(id)?.username || "Unknown",
        value: id,
      }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await channel.send({
    content: "🗳️ **وقت التصويت!** لديكم دقيقة واحدة",
    components: [row],
  });

  // تايمر للتصويت
  setTimeout(() => {
    processVotes(game, client, channel);
  }, 60000); // دقيقة واحدة
}

// ===== معالجة التصويت =====
async function processVotes(game, client, channel) {
  const voteCounts = new Map();
  let voteResults = "📊 **نتائج التصويت:**\n";

  // حساب الأصوات
  for (const [voter, target] of game.votes) {
    const count = voteCounts.get(target) || 0;
    voteCounts.set(target, count + 1);
  }

  // عرض النتائج
  for (const [target, count] of voteCounts) {
    const user = client.users.cache.get(target);
    voteResults += `• **${user?.username || "مجهول"}**: ${count} صوت\n`;
  }

  if (voteCounts.size === 0) {
    await channel.send(voteResults + "\n❌ لم يصوت أحد! لا يتم إعدام أحد.");
    game.round++;
    setTimeout(() => startNightPhase(game, client), 5000);
    return;
  }

  // العثور على أعلى عدد أصوات
  const maxVotes = Math.max(...voteCounts.values());
  const candidates = [...voteCounts.entries()].filter(
    ([, votes]) => votes === maxVotes
  );

  if (candidates.length > 1) {
    await channel.send(
      voteResults + "\n⚖️ تعادل في التصويت! لا يتم إعدام أحد."
    );
  } else {
    const [executed] = candidates[0];
    const executedUser = client.users.cache.get(executed);
    const executedRole = game.roles.get(executed);

    game.alivePlayers = game.alivePlayers.filter((id) => id !== executed);
    game.deadPlayers.push(executed);

    await channel.send(
      voteResults +
        `\n⚰️ **${
          executedUser?.username || "مجهول"
        }** تم إعدامه! كان **${executedRole}**`
    );
  }

  // فحص شروط الفوز
  const checkResult = checkWinConditions(game, client);
  if (checkResult) {
    await channel.send({ embeds: [checkResult] });
    activeGames.delete(game.channelId);
    return;
  }

  // الانتقال للليلة التالية
  game.round++;
  setTimeout(() => startNightPhase(game, client), 5000);
}

// ===== فحص شروط الفوز =====
function checkWinConditions(game, client) {
  const aliveMafia = game.alivePlayers.filter(
    (id) => game.roles.get(id) === ROLES.MAFIA
  );
  const aliveCitizens = game.alivePlayers.filter(
    (id) => game.roles.get(id) !== ROLES.MAFIA
  );

  if (aliveMafia.length === 0) {
    return new EmbedBuilder()
      .setTitle("🏆 فاز المواطنون!")
      .setDescription("تم القضاء على جميع أعضاء المافيا!")
      .setColor("#00FF00")
      .addFields({
        name: "🎭 الأدوار",
        value: game.players
          .map((id) => {
            const user = client.users.cache.get(id);
            const role = game.roles.get(id);
            const status = game.alivePlayers.includes(id) ? "✅" : "💀";
            return `${status} **${user?.username || "مجهول"}** - ${role}`;
          })
          .join("\n"),
      });
  }

  if (aliveMafia.length >= aliveCitizens.length) {
    return new EmbedBuilder()
      .setTitle("🏆 فازت المافيا!")
      .setDescription("المافيا تساوي أو تفوق عدد المواطنين!")
      .setColor("#FF0000")
      .addFields({
        name: "🎭 الأدوار",
        value: game.players
          .map((id) => {
            const user = client.users.cache.get(id);
            const role = game.roles.get(id);
            const status = game.alivePlayers.includes(id) ? "✅" : "💀";
            return `${status} **${user?.username || "مجهول"}** - ${role}`;
          })
          .join("\n"),
      });
  }

  return null;
}

// ===== Interaction Handlers =====
async function handleSheriff(interaction, client, game) {
  const targetId = interaction.values[0];
  game.nightActions.set("sheriff_investigate", targetId);

  const role = game.roles.get(targetId);
  const targetUser = client.users.cache.get(targetId);

  await interaction.reply({
    content:
      role === ROLES.MAFIA
        ? `🔴 **${targetUser?.username || "مجهول"}** هذا الشخص مافيا!`
        : `✅ **${targetUser?.username || "مجهول"}** هذا الشخص بريء!`,
    ephemeral: true,
  });

  const channel = await client.channels.fetch(game.channelId);
  setTimeout(() => doctorTurn(game, client, channel), 2000);
}

async function handleDoctor(interaction, client, game) {
  const targetId = interaction.values[0];
  game.nightActions.set("doctor_heal", targetId);

  const targetUser = client.users.cache.get(targetId);
  await interaction.reply({
    content: `✅ حميت **${targetUser?.username || "مجهول"}**!`,
    ephemeral: true,
  });

  const channel = await client.channels.fetch(game.channelId);
  setTimeout(() => mafiaTurn(game, client, channel), 2000);
}

async function handleMafia(interaction, client, game) {
  const targetId = interaction.values[0];
  game.nightActions.set("mafia_kill", targetId);

  const targetUser = client.users.cache.get(targetId);
  await interaction.reply({
    content: `🔪 اخترت **${targetUser?.username || "مجهول"}** كضحية!`,
    ephemeral: true,
  });

  setTimeout(() => startDayPhase(game, client), 2000);
}

async function handleVote(interaction, client, game) {
  const targetId = interaction.values[0];
  const voterId = interaction.user.id;

  if (!game.alivePlayers.includes(voterId)) {
    return interaction.reply({
      content: "💀 الموتى لا يصوتون!",
      ephemeral: true,
    });
  }

  game.votes.set(voterId, targetId);
  const targetUser = client.users.cache.get(targetId);

  await interaction.reply({
    content: `🗳️ صوتك اتسجل ضد **${targetUser?.username || "مجهول"}**`,
    ephemeral: true,
  });
}

