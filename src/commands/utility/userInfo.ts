import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import { getUserId } from "../../utils/getUserId";
import Colors from "../../utils/Colors";
import prisma from "../../struct/Prisma";

export default new Command({
  name: "userinfo",
  description: "Displays information about a user.",
  aliases: ["ui", "user", "u"],
  execute: async (message, args, client) => {
    const target = args[0]
      ? getUserId(args[0], message.guild)
      : message.author.id;

    if (!target) return;

    const user = await client.users
      .fetch(target, { force: true })
      .catch(() => null);

    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription("❌ User not found."),
        ],
      });
    }

    const [userDB, userProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: target },
      }),
      user.fetch(true).catch(() => null),
    ]);

    const displayName = user.globalName ?? user.username;
    const lastFmUser = userDB?.fmUser ?? "Not set";
    const timezone = userDB?.timezone ?? "Not set";
    const birthday = userDB?.birthday ?? "Not set";
    const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;

    const bannerURL = userProfile?.bannerURL({ size: 4096 }) || null;
    const avatarURL = user.displayAvatarURL({ size: 1024 });

    const embedColor = Colors.sunshineYellow;
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${user.username} (${user.id})`,
        iconURL: avatarURL,
      })
      .setColor(embedColor)
      .setDescription(
        `
            **Display Name:** ${displayName}
            **Last.fm:** ${lastFmUser}
            **Timezone:** ${timezone}
            **Birthday:** ${birthday}
            **Account Created:** ${createdAt}
            `
      )
      .setThumbnail(avatarURL);

    if (bannerURL) {
      embed.setImage(bannerURL);
    }

    await message.reply({ embeds: [embed] });
  },
});
