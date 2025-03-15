import Command from "../../struct/Command";
import prisma from "../../struct/Prisma";
import { getUserId } from "../../utils/getUserId";
import { Message, EmbedBuilder, TextChannel } from "discord.js";
import Client from "../../struct/Client";
import Colors from "../../utils/Colors";
import userByCacheOrFetch from "../../utils/userByCacheOrFetch";
import commas from "../../utils/commas";

const FM_API_KEY = process.env.FM_KEY;
const FM_API_URL = "http://ws.audioscrobbler.com/2.0/";

export default new Command({
  name: "lastfm",
  description: "Replies with latest Last.fm scrobble",
  execute: async (message, args, client): Promise<void> => {
    const targetId = args[0] ? getUserId(args[0]) : message.author.id;
    if (!targetId) {
      const embed = new EmbedBuilder()
        .setColor(Colors.hotPinkPop)
        .setDescription("Invalid user mention or ID.");
      await message.reply({ embeds: [embed] });
      return;
    }

    const userForced = await userByCacheOrFetch(targetId, client);
    if (!userForced) {
      const embed = new EmbedBuilder()
        .setColor(Colors.hotPinkPop)
        .setDescription("Invalid user mention or ID.");
      await message.reply({ embeds: [embed] });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user || !user.fmUser) {
      const embed = new EmbedBuilder()
        .setColor(Colors.hotPinkPop)
        .setDescription(
          `**${userForced.username}** hasn't set their Last.fm username.`
        );
      await message.reply({ embeds: [embed] });
      return;
    }
    if (message.channel instanceof TextChannel) {
      message.channel.sendTyping();
    }
    const [trackData, userInfoData] = await Promise.all([
      fetch(
        `${FM_API_URL}?method=user.getrecenttracks&username=${encodeURIComponent(user.fmUser)}&api_key=${FM_API_KEY}&format=json`
      ),
      fetch(
        `${FM_API_URL}?method=user.getinfo&user=${user.fmUser}&api_key=${FM_API_KEY}&format=json`
      ),
    ]);

    const data = await trackData.json();
    const userInfo = await userInfoData.json();

    if (!data.recenttracks || !data.recenttracks.track.length) {
      const embed = new EmbedBuilder()
        .setColor(Colors.hotPinkPop)
        .setDescription(
          "Couldn't find any recent scrobbles for this Last.fm account."
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    const totalScrobbles = userInfo.user?.playcount || "Unknown";
    const latestTrack = data.recenttracks.track[0];
    const nowPlaying = latestTrack["@attr"]?.nowplaying === "true";

    const trackName = latestTrack.name;
    const artistName = latestTrack.artist["#text"];
    const trackInfoResponse = await fetch(
      `${FM_API_URL}?method=track.getInfo&api_key=${FM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&username=${user.fmUser}&format=json`
    );
    const trackInfo = await trackInfoResponse.json();

    if (trackInfo.error) {
      const embed = new EmbedBuilder()
        .setColor(Colors.hotPinkPop)
        .setDescription("Error fetching track details.");
      await message.reply({ embeds: [embed] });
      return;
    }

    const trackPlayCount = trackInfo.track?.userplaycount || "Unknown";

    let iconurl: string | undefined = undefined;
    if (latestTrack.image && latestTrack.image.length > 0) {
      const largestImage = latestTrack.image.reduce(
        (largest: any, current: any) => {
          const sizes = ["small", "medium", "large", "extralarge"];
          return sizes.indexOf(current.size) > sizes.indexOf(largest.size)
            ? current
            : largest;
        }
      );
      iconurl =
        largestImage["#text"] ||
        latestTrack.album?.image?.[0]["#text"] ||
        undefined;
    }

    let userIconUrl: string | undefined = undefined;
    if (userInfo?.user?.image && userInfo?.user?.image.length > 0) {
      const largestImage = userInfo?.user?.image.reduce(
        (largest: any, current: any) => {
          const sizes = ["small", "medium", "large", "extralarge"];
          return sizes.indexOf(current.size) > sizes.indexOf(largest.size)
            ? current
            : largest;
        }
      );
      userIconUrl =
        largestImage["#text"] || userForced.avatarURL() || undefined;
    }
    const embed = new EmbedBuilder()
      .setColor(Colors.sunshineYellow)
      .setAuthor({
        name: `${nowPlaying ? "Now Playing" : "Last Played Track"} - ${userForced.displayName}`,
        iconURL: userIconUrl,
        url: userInfo?.user?.url,
      })
      .setDescription(
        `### [${trackName}](${latestTrack.url})\n\n**${artistName} ·** ${latestTrack.album["#text"] || "No album"}`
      )
      .setFooter({
        text: `Track Scrobbles: ${commas(trackPlayCount)} · Total Scrobbles: ${commas(totalScrobbles)}`,
      });

    if (iconurl) embed.setThumbnail(iconurl);
    await message.reply({ embeds: [embed] });
  },
  aliases: ["fm"],
  subs: [
    {
      name: "set",
      description: "Set your Last.fm username",
      async execute(message, args, client): Promise<void> {
        const username = args[0];
        if (!username) {
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("Please provide your Last.fm username.");
          await message.reply({ embeds: [embed] });
          return;
        }

        const apiKey = process.env.FM_KEY;
        const url = `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`;

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.error) {
            const embed = new EmbedBuilder()
              .setColor("Red")
              .setDescription("The Last.fm username does not exist.");
            await message.reply({ embeds: [embed] });
            return;
          }

          await prisma.user.upsert({
            where: { id: message.author.id },
            update: { fmUser: username },
            create: { id: message.author.id, fmUser: username },
          });

          const embed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `Your Last.fm username has been set to **${username}**.`
            );
          await message.reply({ embeds: [embed] });
        } catch (error) {
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("An error occurred while verifying the username.");
          await message.reply({ embeds: [embed] });
        }
      },
    },
    {
      name: "remove",
      description: "Remove your Last.fm username",
      async execute(message, args, client): Promise<void> {
        await prisma.user.update({
          where: { id: message.author.id },
          data: { fmUser: null },
        });
        const embed = new EmbedBuilder()
          .setColor("Green")
          .setDescription("Your Last.fm username has been removed.");
        await message.reply({ embeds: [embed] });
      },
    },
  ],
});
