import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import Colors from "../../utils/Colors";
import { getUserId } from "../../utils/getUserId";
import userByCacheOrFetch from "../../utils/userByCacheOrFetch";

const usersToGayRate = ["778079465694691329"];

export default new Command({
  name: "gayrate",
  description: "Replies with how gay a user is",
  aliases: ["gay"],
  execute: async (message, args, client) => {
    const target = args[0]
      ? getUserId(args[0], message.guild)
      : message.author.id;

    if (!target) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription(`The user was not found`),
        ],
      });
    }

    const user = await userByCacheOrFetch(target, client);

    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription("User not found."),
        ],
      });
    }
    let gayrate = Math.ceil(Math.random() * 100);

    if (usersToGayRate.includes(target)) {
      gayrate = 100;
    }

    const progressBar = createProgressBar(gayrate);

    const embed = new EmbedBuilder()
      .setColor(Colors.sunshineYellow)
      .setDescription(
        `**${user.username}** is ${gayrate}% gay\n\n${progressBar}`
      );

    await message.reply({ embeds: [embed] });
  },
});

function createProgressBar(percent: number): string {
  const filledChar = "🏳️‍🌈";
  const emptyChar = "⬜";
  const totalBars = 10;
  const filledBars = Math.round((percent / 100) * totalBars);
  const emptyBars = totalBars - filledBars;

  return filledChar.repeat(filledBars) + emptyChar.repeat(emptyBars);
}
