import { TextChannel } from 'discord.js';
import Command from '../../struct/Command';

export default new Command({
  name: 'say',
  description: 'Make the bot say something.',
  aliases: ['speak', 'echo'],
  execute: async (message, args, client) => {
    if (!(message.channel instanceof TextChannel)) {
      return;
    }

    if (!args.length) {
      return message.channel.send('Please provide a message for me to say!');
    }
    if (message.deletable) {
      await message.delete();
    }
    const textToSay = args.join(' ');

    message.channel.send(textToSay);
  },
  botPermissions: ['SendMessages'],
  userPermissions: ['Administrator'],
});
