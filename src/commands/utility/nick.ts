import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import Colors from "../../utils/Colors";
import escapeMarkdown from "../../utils/escapeMarkdown";
import { getUserId } from "../../utils/getUserId";
import memberByCacheOrFetch from "../../utils/memberByCacheOrFetch";

export default new Command({
  name: "nickname",
  description: "Change your or someone's server nickname",
  aliases: ["nick"],
  botPermissions: ["ManageNicknames"],
  cooldown: 10,
  subs: [
    {
      name: "me",
      description: "Change your server nickname",
      botPermissions: ["ManageNicknames"],
      userPermissions: ["ChangeNickname"],
      async execute(message, args, client) {
        const newNick = args.join(" ");

        if (!newNick) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription("Please provide a new nickname"),
            ],
          });
        }

        if (newNick.length > 32) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription("Nickname must be 32 characters or less"),
            ],
          });
        }
        const member = await memberByCacheOrFetch(
          message.guild.id,
          message.author.id,
          client
        );
        if (!member)
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(`The user is not in the server.`),
            ],
          });
        if (message.guild.ownerId === message.author.id) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  `I cannot modify your nickname as you are the owner.`
                ),
            ],
          });
        }
        if (
          member.roles.highest.position >=
          message.guild.members.me.roles.highest.position
        ) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "I cannot modify your nickname as their role is higher than or equal to mine"
                ),
            ],
          });
        }

        if (newNick.length > 32) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription("Nickname must be 32 characters or less"),
            ],
          });
        }

        if (
          member.roles.highest.position >=
          message.guild.members.me.roles.highest.position
        ) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "I cannot modify your nickname as their role is higher than or equal to mine"
                ),
            ],
          });
        }
        try {
          await message.member.setNickname(newNick);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.sunshineYellow)
                .setDescription(
                  `Successfully updated your nickname to **${escapeMarkdown(newNick)}**`
                ),
            ],
          });
        } catch (error) {
          console.error("Error changing nickname:", error);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "Failed to change your nickname. I might not have permission to modify your nickname."
                ),
            ],
          });
        }
      },
    },
    {
      name: "user",
      description: "Change another user's nickname",
      botPermissions: ["ManageNicknames"],
      userPermissions: ["ManageNicknames"],
      async execute(message, args, client) {
        if (args.length < 2) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription("Please provide a user and their new nickname"),
            ],
          });
        }

        const targetUser = getUserId(args[0], message.guild);
        if (!targetUser) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription("Could not find that user"),
            ],
          });
        }

        const member = await memberByCacheOrFetch(
          message.guild.id,
          targetUser,
          client
        );
        if (!member)
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(`The user is not in the server.`),
            ],
          });
        const newNick = args.slice(1).join(" ");
        if (message.guild.ownerId === targetUser) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  `I cannot modify your nickname as the user is the owner.`
                ),
            ],
          });
        }
        if (
          member.roles.highest.position >=
          message.guild.members.me.roles.highest.position
        ) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "I cannot modify that user's nickname as their role is higher than or equal to mine"
                ),
            ],
          });
        }

        if (
          member.roles.highest.position >= message.member.roles.highest.position
        ) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "You cannot modify that user's nickname as their role is higher than or equal to yours"
                ),
            ],
          });
        }

        if (newNick.length > 32) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription("Nickname must be 32 characters or less"),
            ],
          });
        }

        if (
          member.roles.highest.position >=
          message.guild.members.me.roles.highest.position
        ) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "I cannot modify that user's nickname as their role is higher than or equal to mine"
                ),
            ],
          });
        }

        if (
          member.roles.highest.position >= message.member.roles.highest.position
        ) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "You cannot modify that user's nickname as their role is higher than or equal to yours"
                ),
            ],
          });
        }

        try {
          await member.setNickname(newNick);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.sunshineYellow)
                .setDescription(
                  `Successfully updated ${member}'s nickname to **${escapeMarkdown(newNick)}**`
                ),
            ],
          });
        } catch (error) {
          console.error("Error changing nickname:", error);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.hotPinkPop)
                .setDescription(
                  "Failed to change the user's nickname. I might not have permission to modify their nickname."
                ),
            ],
          });
        }
      },
    },
  ],
});
