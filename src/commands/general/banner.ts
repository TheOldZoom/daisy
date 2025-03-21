import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import Command from "../../struct/Command";
import Colors from "../../utils/Colors";
import { getUserId } from "../../utils/getUserId";
import { getTargetUser } from "../../utils/getTargetUser";

export default new Command({
  name: "banner",
  description: "Displays the banner of a user.",
  aliases: ["ba"],
  execute: async (message, args, client) => {
    const target = args[0]
      ? getUserId(args[0], message.guild)
      : message.author.id;

    const targetResponse = await getTargetUser(target, client);
    if (!targetResponse.success) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription("User not found."),
        ],
      });
    }
    const user = targetResponse.user;

    const bannerURL = user.bannerURL({ size: 1024 }) || null;

    const embed = new EmbedBuilder()
      .setColor(Colors.sunshineYellow)
      .setTitle(`${user.username}'s Banner`)
      .setImage(bannerURL);
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Banner URL")
          .setURL(bannerURL || "")
          .setDisabled(!bannerURL)
          .setStyle(ButtonStyle.Link)
      );
    await message.reply({ embeds: [embed], components: [row] });
  },
});
