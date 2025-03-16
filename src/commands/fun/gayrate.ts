import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import Colors from "../../utils/Colors";
import { getUserId } from "../../utils/getUserId";
import userByCacheOrFetch from "../../utils/userByCacheOrFetch";
import gayRate from "../../inters/gayRate";

const usersToGayRate = ["778079465694691329", "1189669459263238280"];

export default new Command({
  name: "gayrate",
  description: "Replies with how gay a user is",
  aliases: ["gay"],
  execute: async (message, args, client) => {
    const target = (
      args[0] ? getUserId(args[0], message.guild) : message.author.id
    ) as string;
    const embed = await gayRate(client, target);
    await message.reply({ embeds: [embed] });
  },
});
