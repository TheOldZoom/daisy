import { EmbedBuilder } from "discord.js";
import Colors from "../utils/Colors";
import Client from "../struct/Client";
import userByCacheOrFetch from "../utils/userByCacheOrFetch";

const usersToGayRate = ["778079465694691329", "1189669459263238280"];

export default async (client: Client, target: string) => {
  const user = await userByCacheOrFetch(target, client);

  if (!user) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.hotPinkPop)
          .setDescription("User not found."),
      ],
    };
  }
  let gayrate = Math.ceil(Math.random() * 100);

  if (usersToGayRate.includes(target)) {
    gayrate = 100;
  }

  const progressBar = gayProgressBar(gayrate);

  const embed = new EmbedBuilder()
    .setColor(Colors.sunshineYellow)
    .setDescription(
      `**${user.username}** is ${gayrate}% gay\n\n${progressBar}`
    );
  return {
    embeds: [embed],
  };
};

function gayProgressBar(percent: number): string {
  const filledChar = "🏳️‍🌈";
  const emptyChar = "⬜";
  const totalBars = 10;
  const filledBars = Math.round((percent / 100) * totalBars);
  const emptyBars = totalBars - filledBars;

  return filledChar.repeat(filledBars) + emptyChar.repeat(emptyBars);
}
