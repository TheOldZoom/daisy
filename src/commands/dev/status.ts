import { EmbedBuilder, Message, ActivityType } from "discord.js";
import Command from "../../struct/Command";
import prisma from "../../struct/Prisma";
import Colors from "../../utils/Colors";
import { processStatus } from "../../events/ready";

export default new Command({
  name: "status",
  description: "View, add, remove, or manage bot statuses.",
  aliases: ["st"],
  devOnly: true,
  example:
    "status list - View all statuses with IDs\nstatus add Playing with {guilds.size} servers - Add a new status\nstatus remove 3 - Remove status with ID 3\nstatus update - Update bot status immediately",

  subs: [
    {
      name: "add",
      description: "Add a new status for the bot.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

        if (args.length < 2) {
          embed.setDescription(
            "Please provide both a status type and text.\nUsage: `status add <type> <text> [url]`\nValid types: Playing, Watching, Listening, Competing, Streaming"
          );
          await message.reply({ embeds: [embed] });
          return;
        }

        const type = args[0];
        const validTypes = [
          "Playing",
          "Watching",
          "Listening",
          "Competing",
          "Streaming",
          "Custom",
        ];

        if (!validTypes.includes(type)) {
          embed.setDescription(
            "Invalid status type. Valid types are: Playing, Watching, Listening, Competing, Streaming"
          );
          await message.reply({ embeds: [embed] });
          return;
        }

        args.shift();
        let url = null;

        if (type === "Streaming") {
          const lastArg = args[args.length - 1];
          if (lastArg && lastArg.startsWith("http")) {
            url = lastArg;
            args.pop();
          } else {
            url = "https://www.twitch.tv/TheOldZoom";
          }
        }

        const text = args.join(" ");

        await prisma.status.create({
          data: {
            text,
            type,
            url,
          },
        });

        embed.setDescription(`Added new ${type} status: "${text}"`);
        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: "remove",
      description: "Remove a status by its ID.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

        if (!args[0]) {
          embed.setDescription("Please provide a status ID to remove.");
          await message.reply({ embeds: [embed] });
          return;
        }

        const idString = args[0];
        const id = parseInt(idString, 10);

        if (isNaN(id)) {
          embed
            .setDescription("Please provide a valid numeric ID.")
            .setColor(Colors.hotPinkPop);
          await message.reply({ embeds: [embed] });
          return;
        }

        try {
          const status = await prisma.status.delete({
            where: { id },
          });

          embed.setDescription(
            `Removed status: "${status.text}" (${status.type})`
          );
        } catch (error) {
          embed
            .setDescription(`Status with ID ${id} not found.`)
            .setColor(Colors.hotPinkPop);
        }

        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: "list",
      description: "List all statuses with their IDs.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

        const statuses = await prisma.status.findMany();

        if (statuses.length === 0) {
          embed
            .setDescription("There are currently no statuses set for the bot.")
            .setColor(Colors.hotPinkPop);
        } else {
          embed.setTitle("Bot Statuses");

          statuses.forEach((status) => {
            embed.addFields({
              name: `ID: ${status.id} (${status.type})`,
              value: status.text + (status.url ? `\nURL: ${status.url}` : ""),
            });
          });
        }

        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: "update",
      description: "Update now to a random status.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

        const statuses = await prisma.status.findMany();

        if (statuses.length === 0) {
          embed
            .setDescription("There are no statuses to update to.")
            .setColor(Colors.hotPinkPop);
          await message.reply({ embeds: [embed] });
          return;
        }

        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];

        const processedStatus = processStatus(
          {
            text: randomStatus.text,
            type: randomStatus.type,
            url: randomStatus.url || undefined,
          },
          client
        );
        if (randomStatus.type === "Streaming") {
          client.user?.setActivity(processedStatus, {
            type: ActivityType.Streaming,
            url: randomStatus.url || "https://www.twitch.tv/TheOldZoom",
          });
        } else if (randomStatus.type === "Custom") {
          client.user?.setActivity(processedStatus, {
            type: ActivityType.Custom,
          });
        } else {
          const activityType =
            ActivityType[randomStatus.type as keyof typeof ActivityType];
          client.user?.setActivity(processedStatus, {
            type: activityType,
          });
        }
        embed.setDescription(
          `Status updated to: "${processedStatus}" (${randomStatus.type})`
        );
        await message.reply({ embeds: [embed] });
      },
    },
  ],
});
