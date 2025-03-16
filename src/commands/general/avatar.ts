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
  name: "avatar",
  description: "Displays the avatar of a user.",
  aliases: ["av"],
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
    const avatarURL = user.displayAvatarURL({ size: 1024 });

    const embed = new EmbedBuilder()
      .setColor(Colors.sunshineYellow)
      .setTitle(`${user.username}'s Avatar`)
      .setImage(avatarURL);
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Avatar URL")
          .setURL(avatarURL)
          .setDisabled(!avatarURL)
          .setStyle(ButtonStyle.Link)
      );
    await message.reply({ embeds: [embed], components: [row] });
  },
});
