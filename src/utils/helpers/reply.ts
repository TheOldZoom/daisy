import { Colors, EmbedBuilder } from "discord.js";
import { GuildMessage } from "../../struct/Command";

export const errorReply = async (
  message: GuildMessage,
  msg: string
): Promise<void> => {
  await message.reply({
    embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(msg)],
  });
};
