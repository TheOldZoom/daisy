import { EmbedBuilder, Message, TextChannel } from "discord.js";
import Client from "../../struct/Client";
import Colors from "../../utils/Colors";
import getAIResponse from "../../utils/getAIResponse";
import { GuildMessage } from "../../struct/Command";

export default {
  async execute(message: Message, client: Client) {
    if (message.author.bot || !message.inGuild()) return;
    if (!message.channel.isSendable()) return;

    const botMention = `<@${client.user?.id}>`;
    if (message.content.toLowerCase().startsWith(botMention.toLowerCase())) {
      const question = message.content.slice(botMention.length).trim();

      if (question) {
        return handleAIReply(message, client, question);
      }
    }

    if (message.reference && message.reference.messageId) {
      const repliedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );
      if (
        repliedMessage.author.bot &&
        repliedMessage.author.id === client.user?.id
      ) {
        const question = message.content;
        return handleAIReply(message, client, question);
      }
    }

    const prefixes = [client.prefix];

    const userPrefix = client.prefixes.get(message.author.id);
    if (userPrefix) prefixes.push(userPrefix);

    const guildPrefix = client.prefixes.get(message.guild.id);
    if (guildPrefix) prefixes.push(guildPrefix);

    const messageContent = message.content.toLowerCase();
    const prefix = prefixes.find((p) => messageContent.startsWith(p));

    if (!prefix) {
      return handleAIReply(message, client);
    }

    const userBlacklist = client.blacklists.get(message.author.id);
    if (userBlacklist) {
      return message
        .reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("You are blacklisted from using the bot.")
              .setColor(Colors.hotPinkPop),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
    }

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    let command = client.commands.get(commandName);
    if (!command) {
      command = client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );
    }
    if (!command) return;

    let currentCommand = command;
    let remainingArgs = [...args];
    const processedCommandPath = [commandName];

    while (remainingArgs.length > 0) {
      const subcommandName = remainingArgs[0].toLowerCase();
      const subcommand = currentCommand.getSubcommand?.(subcommandName);

      if (!subcommand) {
        break;
      }

      processedCommandPath.push(subcommandName);

      remainingArgs.shift();
      currentCommand = subcommand;
    }

    let fullCommand = prefix + processedCommandPath.join(" ");
    if (remainingArgs.length > 0) {
      fullCommand += " " + remainingArgs.join(" ");
    }
    if (command.devOnly && message.author.id !== client.devId) {
      client.logs.info(
        `${message.author.tag} (${message.author.id}) tried to execute command ${fullCommand} in guild ${message.guild?.name} (${message.guild?.id})`
      );
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("This command is only available to the bot owner.")
            .setColor(Colors.hotPinkPop),
        ],
      });
    }

    if (
      currentCommand.userPermissions &&
      !message.member?.permissions.has(currentCommand.userPermissions)
    ) {
      const missingPermissions = currentCommand.userPermissions.filter(
        (perm: any) => !message.member?.permissions.has(perm)
      );
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `You are missing the following permissions: \`${missingPermissions.join(", ")}\``
            )
            .setColor(Colors.hotPinkPop),
        ],
      });
    }

    if (
      currentCommand.botPermissions &&
      !message.guild?.members.me?.permissions.has(currentCommand.botPermissions)
    ) {
      const missingPermissions = currentCommand.botPermissions.filter(
        (perm: any) => !message.guild?.members.me?.permissions.has(perm)
      );
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `I am missing the following permissions: \`${missingPermissions.join(", ")}\``
            )
            .setColor(Colors.hotPinkPop),
        ],
      });
    }

    if (
      currentCommand.cooldown &&
      client.cooldowns.has(command.name + message.author.id)
    ) {
      const expirationTime = client.cooldowns.get(
        command.name + message.author.id
      ) as number;
      const now = Math.floor(Date.now() / 1000);
      if (now < expirationTime / 1000) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Please wait <t:${Math.floor(expirationTime / 1000)}:R> before using this command again.`
              )
              .setColor(Colors.hotPinkPop),
          ],
        });
      }
    }

    if (currentCommand.cooldown) {
      client.cooldowns.set(
        command.name + message.author.id,
        Date.now() + currentCommand.cooldown * 1000
      );
    }

    if (!currentCommand.execute) {
      const helpEmbed = new EmbedBuilder()
        .setTitle(`Help: ${processedCommandPath.join(" ")}`)
        .setDescription(command.example)
        .addFields(
          {
            name: "Usage",
            value: `${prefix}${processedCommandPath.join(" ")} [subcommand] [options]`,
          },
          {
            name: "Subcommands",
            value:
              currentCommand.subs.length > 0
                ? currentCommand.subs.map((sub: any) => sub.name).join(", ")
                : "None",
          }
        )
        .setColor(Colors.hotPinkPop);

      return message.reply({ embeds: [helpEmbed] });
    }

    client.logs.info(
      `Command ${fullCommand} executed by ${message.author.tag} (${message.author.id}) on guild ${message.guild?.name} (${message.guild?.id})`
    );

    try {
      await currentCommand.execute(message, remainingArgs, client);
    } catch (error) {
      client.logs.error(`Error executing command ${commandName}`);
      client.logs.error(error);

      try {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                "Something went wrong while executing the command."
              )
              .setColor(Colors.hotPinkPop),
          ],
        });
      } catch (replyError) {
        client.logs.error(
          "Failed to send error reply",
          replyError instanceof Error ? replyError.message : String(replyError)
        );
      }
    }
  },
};

async function handleAIReply(
  message: Message,
  client: Client,
  question?: string
) {
  if (message.reference && message.reference.messageId) {
    const repliedMessage = await message.channel.messages.fetch(
      message.reference.messageId
    );
    if (
      repliedMessage.author.bot &&
      repliedMessage.author.id === client.user?.id
    ) {
      try {
        if (!(message.channel instanceof TextChannel)) {
          return;
        }
        client.logs.info(
          `${message.author.username} (${message.author.id}) requested: "${question || message.content}"`
        );

        await message.channel.sendTyping();
        const answer = await getAIResponse(
          message as GuildMessage,
          client,
          question || message.content
        );
        if (!answer) return;
        return message.reply(answer);
      } catch (error) {
        return message.reply(error as any);
      }
    }
  }

  if (question) {
    try {
      if (!(message.channel instanceof TextChannel)) {
        return;
      }
      client.logs.info(
        `${message.author.username} (${message.author.id}) requested: "${question || message.content}"`
      );

      await message.channel.sendTyping();
      const answer = await getAIResponse(
        message as GuildMessage,
        client,
        question
      );
      if (!answer) return;

      return message.reply(answer);
    } catch (error) {
      return message.reply(error as any);
    }
  }
}
