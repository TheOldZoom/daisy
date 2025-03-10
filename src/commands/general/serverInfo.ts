import { EmbedBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter, GuildNSFWLevel } from 'discord.js';
import Command from '../../struct/Command';
import Colors from '../../utils/Colors';
import prisma from '../../struct/prisma';
import commas from '../../utils/commas';

export default new Command({
    name: 'serverinfo',
    description: 'Displays detailed information about the current server.',
    aliases: ['si', 'server', 'guild'],
    execute: async (message, args, client) => {
        try {
            if (!message.guild) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.hotPinkPop)
                            .setDescription('❌ This command can only be used in a server.')
                    ]
                });
            }

            const guild = message.guild;
            await guild.fetch();

            const serverDB = await prisma.guild.findUnique({
                where: { id: guild.id },
                include: {
                    _count: {
                        select: {
                            guildLevels: true
                        }
                    }
                }
            }).catch(() => null);

            const messageStats = await prisma.userMessages.groupBy({
                by: ['guildId'],
                where: {
                    guildId: guild.id
                },
                _sum: {
                    total: true,
                    wordCount: true
                },
                _count: {
                    userId: true
                }
            }).catch(() => []);

            const topUsers = await prisma.guildUserLevel.findMany({
                where: {
                    guildId: guild.id
                },
                orderBy: {
                    level: 'desc'
                },
                take: 3,
                include: {
                    user: true
                }
            }).catch(() => []);

            const owner = await guild.members.fetch(guild.ownerId).catch(() => null);
            const ownerTag = owner ? `${owner.user.username} (${guild.ownerId})` : guild.ownerId;

            const channelCounts = {
                text: guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size,
                voice: guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size,
                announcement: guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement).size,
                forum: guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size,
                category: guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size,
                stage: guild.channels.cache.filter(c => c.type === ChannelType.GuildStageVoice).size,
                total: guild.channels.cache.size
            };

            const totalMembers = guild.memberCount;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;

            const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
            const createdAtRelative = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;

            const boostLevel = guild.premiumTier ? `Level ${guild.premiumTier}` : 'Level 0';
            const boostCount = guild.premiumSubscriptionCount || 0;

            const verificationLevels = {
                [GuildVerificationLevel.None]: 'None',
                [GuildVerificationLevel.Low]: 'Low',
                [GuildVerificationLevel.Medium]: 'Medium',
                [GuildVerificationLevel.High]: 'High',
                [GuildVerificationLevel.VeryHigh]: 'Very High'
            };

            const contentFilterLevels = {
                [GuildExplicitContentFilter.Disabled]: 'Disabled',
                [GuildExplicitContentFilter.MembersWithoutRoles]: 'Members Without Roles',
                [GuildExplicitContentFilter.AllMembers]: 'All Members'
            };

            const nsfwLevels = {
                [GuildNSFWLevel.Default]: 'Default',
                [GuildNSFWLevel.Explicit]: 'Explicit',
                [GuildNSFWLevel.Safe]: 'Safe',
                [GuildNSFWLevel.AgeRestricted]: 'Age Restricted'
            };

            const totalMessages = messageStats[0]?._sum.total || 0;
            const totalWords = messageStats[0]?._sum.wordCount || 0;
            const activeUsers = messageStats[0]?._count.userId || 0;

            const customPrefix = serverDB?.prefix || client.prefix || '!';


            let topUsersString = 'None tracked yet';
            if (topUsers.length > 0) {
                topUsersString = topUsers.map((userData, index) =>
                    `${index + 1}. ${userData.user.id ? `<@${userData.user.id}>` : 'Unknown'} (Level ${commas(userData.level)})`
                ).join('\n');
            }

            const mainEmbed = new EmbedBuilder()
                .setAuthor({
                    name: guild.name,
                    iconURL: guild.iconURL() || undefined
                })
                .setColor(Colors.sunshineYellow)
                .setThumbnail(guild.iconURL({ size: 1024 }))
                .setDescription(`**ID:** ${guild.id}\n${guild.description || ''}

**👑 Owner**
${ownerTag}

**📅 Server Created**
${createdAt}
(${createdAtRelative})

**👤 Members**
Total: ${commas(totalMembers)}
Bots: ${commas(botCount)}

**💬 Channels**
Total: ${commas(channelCounts.total)}
Text: ${commas(channelCounts.text)}
Voice: ${commas(channelCounts.voice)}
Announcement: ${commas(channelCounts.announcement)}
Forum: ${commas(channelCounts.forum)}
Categories: ${commas(channelCounts.category)}
Stage: ${channelCounts.stage}

**🚀 Boost Status**
${boostLevel}
Boosts: ${boostCount}

**⚙️ Server Settings**
Verification: ${verificationLevels[guild.verificationLevel]}
Content Filter: ${contentFilterLevels[guild.explicitContentFilter]}
NSFW Level: ${nsfwLevels[guild.nsfwLevel]}
Custom Prefix: ${customPrefix}

**📊 Database Stats**
Tracked Messages: ${commas(totalMessages)}
Total Words: ${commas(totalWords)}
Active Users: ${commas(activeUsers)}
Tracked Levels: ${commas(activeUsers)}

**🏆 Top Users by Level**
${topUsersString}`);

            if (guild.bannerURL()) {
                mainEmbed.setImage(guild.bannerURL({ size: 4096 }));
            }

            if (guild.features.length > 0) {
                mainEmbed.setDescription(mainEmbed.data.description + `\n\n**✨ Server Features**\n${guild.features.map(f =>
                    `\`${f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}\``
                ).join(', ')}`);
            }

            await message.reply({ embeds: [mainEmbed] });
        } catch (error) {
            console.error('Error in serverinfo command:', error);
            await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.hotPinkPop)
                        .setDescription('❌ An error occurred while fetching server information.')
                ]
            });
        }
    },
});