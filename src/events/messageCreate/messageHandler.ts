import { Message, PermissionResolvable } from "discord.js";
import Client from "../../struct/Client";
import Command, { GuildMessage, Subcommand } from "../../struct/Command";
import { errorReply } from "../../utils/helpers/reply";

export default async (message: Message, client: Client) => {
  if (message.author.bot || !message.inGuild()) return;

  const prefixes = [client.prefix];

  const userPrefix = client.prefixes.get(message.author.id);
  if (userPrefix) prefixes.push(userPrefix);

  const guildPrefix = client.prefixes.get(message.guild.id);
  if (guildPrefix) prefixes.push(guildPrefix);

  const prefix = prefixes.find((p) =>
    message.content.toLowerCase().startsWith(p)
  );
  if (!prefix) return;

  client.logs.debug(`Message received with prefix: ${prefix}`);
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) {
    client.logs.debug("No command name found after prefix");
    return;
  }

  client.logs.debug(`Command name: ${commandName}, Args: ${args.join(", ")}`);
  let command = client.commands.get(commandName) as Command;
  if (!command) {
    command = client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    ) as Command;
  }

  if (!command) {
    client.logs.debug(`Command not found: ${commandName}`);
    return;
  }

  client.logs.info(
    `Command "${command.name}" invoked by ${message.author.tag} (${message.author.id}) in guild ${message.guild.name} (${message.guild.id})`
  );

  if (command.devOnly && message.author.id !== client.devId) {
    client.logs.warn(
      `Non-dev user ${message.author.tag} attempted to use dev-only command: ${command.name}`
    );
    return errorReply(
      message as GuildMessage,
      "This command is only available to the bot owner."
    );
  }

  const missingDefaultPermissions: string[] = [];
  client.botDefaultPerm.forEach((perm) => {
    if (
      !message.channel.permissionsFor(message.guild?.members.me!)?.has(perm)
    ) {
      missingDefaultPermissions.push(perm as string);
    }
  });

  if (missingDefaultPermissions.length > 0) {
    client.logs.warn(
      `Bot lacks default permissions in channel ${message.channel.id} for command: ${command.name}. Missing: ${missingDefaultPermissions.join(", ")}. Ignoring command.`
    );
    return;
  }

  if (
    command.userPermissions &&
    !message.member?.permissions.has(command.userPermissions)
  ) {
    const missingPermissions = command.userPermissions.filter(
      (perm) => !message.member?.permissions.has(perm)
    );
    client.logs.debug(
      `User ${message.author.tag} lacks permissions for command: ${command.name}. Missing: ${missingPermissions.join(", ")}`
    );
    return errorReply(
      message as GuildMessage,
      `You don't have the required permissions to use this command. You are missing ${missingPermissions.join(", ")}`
    );
  }

  if (
    command.botPermissions &&
    !message.channel
      .permissionsFor(message.guild?.members.me!)
      ?.has(command.botPermissions)
  ) {
    const missingPermissions = command.botPermissions.filter(
      (perm) =>
        !message.channel.permissionsFor(message.guild?.members.me!)?.has(perm)
    );
    client.logs.warn(
      `Bot lacks required permissions in channel ${message.channel.id} for command: ${command.name}. Missing: ${missingPermissions.join(", ")}`
    );
    return errorReply(
      message as GuildMessage,
      `I don't have the required permissions to use this command. I am missing **\`${missingPermissions.join(" `**, **`")}\`**`
    );
  }

  if (command.cooldown) {
    const cooldownKey = `${command.name}-${message.author.id}`;
    const cooldownTime = client.cooldowns.get(cooldownKey);
    if (cooldownTime) {
      const remainingTime = (cooldownTime - Date.now()) / 1000;
      if (remainingTime > 0) {
        client.logs.debug(
          `Cooldown active for command: ${command.name}, user: ${message.author.tag}`
        );
        return errorReply(
          message as GuildMessage,
          `Please wait ${remainingTime.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
        );
      }
    }
    client.cooldowns.set(cooldownKey, Date.now() + command.cooldown * 1000);
    client.logs.debug(
      `Cooldown set for command: ${command.name}, user: ${message.author.tag}`
    );
  }

  try {
    const executeCommand = async (cmd: Command, cmdArgs: string[]) => {
      if (cmd.execute) {
        client.logs.debug(`Executing command: ${cmd.name}`);
        await cmd.execute(message as any, cmdArgs, client);
      } else if (cmd.subs && cmd.subs.length > 0) {
        const subcommandName = cmdArgs[0]?.toLowerCase();
        const subcommand = cmd.getSubcommand(subcommandName);
        if (subcommand) {
          client.logs.debug(
            `Found subcommand: ${subcommandName} of ${cmd.name}`
          );
          cmdArgs.shift();
          await executeCommand(subcommand as unknown as Command, cmdArgs);
        } else {
          client.logs.debug(
            `Invalid subcommand: ${subcommandName} for command: ${cmd.name}`
          );
          return errorReply(
            message as GuildMessage,
            `Invalid subcommand. Available subcommands for ${cmd.name}: ${cmd.subs.map((sub) => sub.name).join(", ")}`
          );
        }
      } else {
        client.logs.debug(
          `Command ${cmd.name} has no execute method or subcommands`
        );
        return errorReply(
          message as GuildMessage,
          "This command is not properly configured."
        );
      }
    };

    await executeCommand(command, args);
    client.logs.info(
      `Command "${command.name}" executed successfully by ${message.author.tag}`
    );
  } catch (error) {
    client.logs.error(`Error executing command ${command.name}:`, error);
    return errorReply(
      message as GuildMessage,
      "There was an error trying to execute that command!"
    );
  }
};
