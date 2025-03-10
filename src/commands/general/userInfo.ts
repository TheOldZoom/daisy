import { EmbedBuilder } from 'discord.js';
import Command from '../../struct/Command';
import { getUserId } from '../../utils/getUserId';
import Colors from '../../utils/Colors';
import prisma from '../../struct/prisma';

export default new Command({
    name: 'userinfo',
    description: 'Ping the bot and get a response.',
    aliases: ['ui', 'user', 'u'],
    execute: async (message, args, client) => {
        const target = args[0] ? getUserId(args[0]) : message.author.id;
        const User = await client.users.fetch(target as string, { force: true }).catch(() => null);

        if (!User) return message.reply({
            embeds: [new EmbedBuilder().setColor(Colors.hotPinkPop).setDescription('User not found.')]
        });

        const userDB = await prisma.user.findFirst({
            where: { id: target as string }
        });

        const userProfile = await User.fetch(true).catch(() => null);

        const displayName = User.globalName ?? User.username;
        const lastFmUser = userDB?.fmUser ?? "Not set";

        const timezone = userDB?.timezone ?? "Not set";
        const birthday = userDB?.birthday ?? "Not set";

        const createdAt = `<t:${Math.floor(User.createdTimestamp / 1000)}:F>`;
        const bannerURL = userProfile?.bannerURL();


        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${User.username} (${User.id})`,
                iconURL: User.displayAvatarURL() || undefined,
            })
            .setColor(userProfile?.accentColor ?? Colors.sunshineYellow)
            .setDescription(`
        **Display Name:** ${displayName}
        **Last.fm:** ${lastFmUser}
        **Timezone:** ${timezone}
        **Birthday:** ${birthday}
        **Created At:** ${createdAt}
    `).setThumbnail(User.avatarURL()).setImage(bannerURL as string).setColor(Colors.sunshineYellow)

        message.reply({ embeds: [embed] });

    },

});
