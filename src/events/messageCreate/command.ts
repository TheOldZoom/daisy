import { EmbedBuilder, Message } from 'discord.js';
import Client from '../../struct/Client';
import Colors from '../../utils/Colors';

export default {
    async execute(message: Message, client: Client) {
        const prefixes = ['d!'];
        const selfprefix = client.selfPrefixes.get(message.author.id);

        if (selfprefix) prefixes.push(selfprefix);

        const messageContent = message.content.toLowerCase();
        const prefix = prefixes.find((p) => messageContent.startsWith(p));

        if (!prefix) return;

        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        let command = client.commands.get(commandName);
        if (!command) {
            command = client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName),
            );
        }
        if (!command) return;

        let currentCommand = command;
        let remainingArgs = [...args];

        // Handle subcommands
        while (remainingArgs.length > 0) {
            const subcommandName = remainingArgs[0].toLowerCase();
            const subcommand = currentCommand.getSubcommand?.(subcommandName);

            if (!subcommand) {
                break;
            }

            remainingArgs.shift();
            currentCommand = subcommand;
        }

        // Dev-only check
        if (currentCommand.devOnly && message.author.id !== client.devId) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('This command is only available to the bot owner.')
                        .setColor(Colors.hotPinkPop),
                ],
            });
        }

        // User permission check
        if (currentCommand.userPermissions && !message.member?.permissions.has(currentCommand.userPermissions)) {
            const missingPermissions = currentCommand.userPermissions.filter(
                (perm: any) => !message.member?.permissions.has(perm)
            );
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `You are missing the following permissions: \`${missingPermissions.join(', ')}\``
                        )
                        .setColor(Colors.hotPinkPop),
                ],
            });
        }

        // Bot permission check
        if (currentCommand.botPermissions && !message.guild?.members.me?.permissions.has(currentCommand.botPermissions)) {
            const missingPermissions = currentCommand.botPermissions.filter(
                (perm: any) => !message.guild?.members.me?.permissions.has(perm)
            );
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `I am missing the following permissions: \`${missingPermissions.join(', ')}\``
                        )
                        .setColor(Colors.hotPinkPop),
                ],
            });
        }

        const now = Date.now();
        if (currentCommand.cooldown && client.cooldowns.has(command.name)) {
            const expirationTime = client.cooldowns.get(command.name) as number;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`Please wait ${timeLeft.toFixed(1)} more seconds before using this command again.`)
                            .setColor(Colors.hotPinkPop),
                    ],
                });
            }
        }

        if (currentCommand.cooldown) {
            client.cooldowns.set(command.name, now + currentCommand.cooldown * 1000);
        }

        // Log command execution
        client.logs.info(
            `Command ${prefix + commandName} executed by ${message.author.tag} (${message.author.id}) on guild ${message.guild?.name} (${message.guild?.id})`,
        );

        try {
            await currentCommand.execute(message, remainingArgs, client);
        } catch (error) {
            client.logs.error(`Error executing command ${commandName}`);
            console.error(error);

            try {
                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription('Something went wrong while executing the command.')
                            .setColor(Colors.hotPinkPop),
                    ],
                });
            } catch (replyError) {
                client.logs.error(
                    'Failed to send error reply',
                    replyError instanceof Error ? replyError.message : String(replyError),
                );
            }
        }
    },
};
