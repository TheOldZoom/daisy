import { Message } from "discord.js";
import Client from "../../struct/Client";

export default {
    async execute(message: Message, client: Client) {
        const prefixes = ["d!"];
        const selfprefix = client.selfPrefixes.get(message.author.id);

        if (selfprefix) prefixes.push(selfprefix);

        const messageContent = message.content.toLowerCase();
        const prefix = prefixes.find(p => messageContent.startsWith(p));

        if (!prefix) return;


        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        let command = client.commands.get(commandName);
        if (!command) {
            command = client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        }
        if (!command) return;

        let currentCommand = command;
        let remainingArgs = [...args];

        while (remainingArgs.length > 0) {
            const subcommandName = remainingArgs[0].toLowerCase();
            const subcommand = currentCommand.getSubcommand?.(subcommandName);

            if (!subcommand) {
                break;
            }

            remainingArgs.shift();
            currentCommand = subcommand;
        }

        try {
            await currentCommand.execute(message, remainingArgs, client);
        } catch (error) {
            client.logs.error(`Error executing command ${commandName}`);
            console.log(error);

            try {
                await message.reply('There was an error executing this command.');
            } catch (replyError) {
                client.logs.error('Failed to send error reply',
                    replyError instanceof Error ? replyError.message : String(replyError)
                );
            }
        }
    }
};
