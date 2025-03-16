import { EmbedBuilder } from "discord.js";
import Client from "../struct/Client";
import Colors from "../utils/Colors";
import prisma from "../struct/Prisma";
import { getTargetUser } from "../utils/getTargetUser";

export default async (client: Client, target: string | null) => {
  const targetResponse = await getTargetUser(target, client);
  if (!targetResponse.success) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.hotPinkPop)
          .setDescription("❌ User not found."),
      ],
    };
  }
  const user = targetResponse.user;
  target = user.id;
  const [userDB, userProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: target },
    }),
    user.fetch(true).catch(() => null),
  ]);

  const displayName = user.globalName ?? user.username;
  const lastFmUser = userDB?.fmUser;
  const timezone = userDB?.timezone;
  const birthday = userDB?.birthday;
  const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;

  const bannerURL = userProfile?.bannerURL({ size: 4096 }) || null;
  const avatarURL = user.displayAvatarURL({ size: 1024 });

  const embedColor = Colors.sunshineYellow;

  const descriptionFields = [
    `**Display Name:** ${displayName}`,
    lastFmUser && `**Last.fm:** ${lastFmUser}`,
    timezone && `**Timezone:** ${timezone}`,
    birthday && `**Birthday:** ${birthday}`,
    `**Account Created:** ${createdAt}`,
  ].filter(Boolean);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${user.username} (${user.id})`,
      iconURL: avatarURL,
    })
    .setColor(embedColor)
    .setDescription(descriptionFields.join("\n"))
    .setThumbnail(avatarURL);

  if (bannerURL) {
    embed.setImage(bannerURL);
  }
  return {
    embeds: [embed],
  };
};
