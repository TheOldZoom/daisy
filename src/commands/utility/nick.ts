import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import Colors from "../../utils/Colors";
import escapeMarkdown from "../../utils/escapeMarkdown";

export default new Command({
  name: "nickme",
  description: "Change your server nickname",
  aliases: ["nick"],
  botPermissions: ["ManageNicknames"],
  cooldown: 10,
  async execute(message, args, client) {
    const newNick = args.join(" ");

    if (!newNick) {
      return message.reply("Please provide a new nickname!");
    }

    if (newNick.length > 32) {
      return message.reply("Nickname must be 32 characters or less!");
    }

    try {
      await message.member.setNickname(newNick);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription(
              `Successfully updated your nickname to **${escapeMarkdown(newNick)}**`
            ),
        ],
      });
    } catch (error) {
      console.error("Error changing nickname:", error);
      return message.reply(
        "Failed to change your nickname. I might not have permission to modify your nickname."
      );
    }
  },
});
