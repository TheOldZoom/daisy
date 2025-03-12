import { EmbedBuilder, Message } from 'discord.js';
import Client from '../../struct/Client';
import Command from '../../struct/Command';
import prisma from '../../struct/Prisma';
import Colors from '../../utils/Colors';

export default new Command({
  name: 'selfprefix',
  description: 'Set or remove your self prefix.',
  aliases: ['sp'],
  execute: async (message, args, client): Promise<void> => {
    const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
    const id = message.author.id;
    const data = await prisma.user.findFirst({
      where: { id },
    });

    if (data?.selfprefix) {
      embed.setDescription(`Your self prefix is **\`${data.selfprefix}\`**.`);
    } else {
      embed
        .setDescription('You do not have a self prefix set.')
        .setColor(Colors.hotPinkPop);
    }

    await message.reply({ embeds: [embed] });
    return;
  },
  subs: [
    {
      name: 'set',
      description: 'Set your self prefix.',
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
        const id = message.author.id;
        const prefix = args[0];

        if (!prefix) {
          embed.setDescription('Please provide a prefix to set.');
          await message.reply({ embeds: [embed] });
          return;
        }

        if (prefix.length > 3) {
          embed.setDescription(
            'Your prefix must not be longer than 3 characters.',
          );
          await message.reply({ embeds: [embed] });
          return;
        }
        await prisma.user.upsert({
          where: { id },
          update: { selfprefix: prefix },
          create: { id, selfprefix: prefix },
        });
        client.prefixes.set(id, prefix);
        embed.setDescription(`Your prefix has been set to \`${prefix}\`.`);
        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: 'remove',
      description: 'Remove your self prefix.',
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
        const id = message.author.id;

        await prisma.user.update({
          where: { id },
          data: { selfprefix: null },
        });
        client.prefixes.delete(id);
        embed.setDescription('Your self prefix has been removed.');
        await message.reply({ embeds: [embed] });
      },
    },
  ],
});
