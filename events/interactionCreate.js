const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

// IDs
const ticketCategoryId = "1411375711066788021"; // كاتيجوري التيكتات
const ticketLogsId = "1411376005268111512"; // روم اللوجز

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // معالجة الأوامر المدخلة (Slash Commands)
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "❌ حصل خطأ وانت بتنّفذ الأمر!",
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    // معالجة تفاعلات الأزرار (Buttons)
    if (interaction.isButton()) {
      const logChannel = interaction.guild.channels.cache.get(ticketLogsId);
      const member = interaction.user;

      // ---------- Create Ticket ----------
      if (interaction.customId === "create_ticket") {
        const existingChannel = interaction.guild.channels.cache.find(
          (c) =>
            c.name.startsWith(`ticket-${member.username}-`) &&
            c.parentId === ticketCategoryId
        );
        if (existingChannel) {
          const memberPermission = existingChannel.permissionsFor(member);
          if (memberPermission.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
              content: "❌ You already have an open ticket.",
              flags: MessageFlags.Ephemeral,
            });
          }
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

          return interaction.reply({
            content: `✅ Your ticket has been created: <#${channel.id}>`,
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

        if (
          member.id !== channel.name.split("-")[1] &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        )
          return interaction.reply({
            content: "❌ You cannot close this ticket.",
            flags: MessageFlags.Ephemeral,
          });

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
        await channel.permissionOverwrites.set([
          {
            id: interaction.guild.roles.everyone.id,
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
          {
            id: member.id,
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.UseApplicationCommands,
            ],
          },
        ]);

        await channel.send({ embeds: [embed], components: [row] });

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

        return interaction.reply({
          content: "✅ Ticket closed.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // ---------- Reopen Ticket ----------
      if (interaction.customId === "reopen_ticket") {
        const channel = interaction.channel;

        if (
          member.id !== channel.name.split("-")[1] &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        )
          return interaction.reply({
            content: "❌ You cannot reopen this ticket.",
            flags: MessageFlags.Ephemeral,
          });

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

        await channel.permissionOverwrites.edit(member.id, {
          SendMessages: true,
        });
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone.id,
          {
            SendMessages: false,
          }
        );

        await channel.send({ embeds: [embed], components: [row] });

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

        return interaction.reply({
          content: "✅ Ticket reopened.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // ---------- Delete Ticket ----------
      if (interaction.customId === "delete_ticket") {
        const channel = interaction.channel;

        if (
          member.id !== channel.name.split("-")[1] &&
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageChannels
          )
        )
          return interaction.reply({
            content: "❌ You cannot delete this ticket.",
            flags: MessageFlags.Ephemeral,
          });

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
    }
  },
};
