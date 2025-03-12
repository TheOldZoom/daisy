import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUserId } from '../../utils/getUserId';
import Command from '../../struct/Command';
import prisma from '../../struct/Prisma';
import moment from 'moment-timezone';
import Colors from '../../utils/Colors';

export default new Command({
  name: 'timezone',
  description: "Get someone's current time",
  aliases: ['tz'],
  execute: async (message, args, client): Promise<void> => {
    if (!args[0] && !message.mentions.users.size) {
      args[0] = message.author.id;
    }

    const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

    const id = getUserId(args[0]);

    if (!id) {
      embed.setDescription('Please provide a valid member from this server.');
      await message.reply({ embeds: [embed] });
      return;
    }

    const member = message.guild?.members.cache.get(id as string);
    if (!member) {
      embed.setDescription('Please mention a valid member from this server.');
      await message.reply({ embeds: [embed] });
      return;
    }

    const data = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!data?.timezone) {
      embed.setDescription(`${member.user.tag} does not have a timezone set.`);
      await message.reply({ embeds: [embed] });
      return;
    }
    const userTime = moment()
      .tz(data.timezone)
      .format('dddd, MMMM Do, hh:mm A');
    embed.setDescription(
      `**${member.user.tag}'s** current time **${userTime}**`,
    );
    await message.reply({ embeds: [embed] });
  },
  subs: [
    {
      name: 'set',
      description: 'Set your timezone',
      execute: async (message, args, client): Promise<void> => {
        if (!args[0]) {
          const embed = new EmbedBuilder().setDescription(
            'Please provide a valid timezone.',
          );
          await message.reply({ embeds: [embed] });
          return;
        }

        const id = message.author.id;
        const timezone = args[0];
        if (!moment.tz.zone(timezone)) {
          const embed = new EmbedBuilder().setDescription(
            'That is not a valid timezone. Please provide a valid timezone.',
          );
          await message.reply({ embeds: [embed] });
          return;
        }

        await prisma.user.upsert({
          where: { id },
          update: { timezone },
          create: { id, timezone },
        });

        const embed = new EmbedBuilder().setDescription(
          `Your timezone has been set to **${timezone}**.`,
        );
        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: 'remove',
      description: 'Remove your timezone',
      execute: async (message, args, client): Promise<void> => {
        const id = message.author.id;
        await prisma.user.update({
          where: { id },
          data: { timezone: null },
        });

        const embed = new EmbedBuilder().setDescription(
          'Your timezone has been removed.',
        );
        await message.reply({ embeds: [embed] });
      },
    },
  ],
});
