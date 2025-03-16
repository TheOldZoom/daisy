import { EmbedBuilder } from "discord.js";
import Colors from "../utils/Colors";
import Client from "../struct/Client";
import { getTargetUser } from "../utils/getTargetUser";

const usersToGayRate = ["778079465694691329", "1189669459263238280"];

export default async (
  client: Client,
  target: string
): Promise<EmbedBuilder> => {
  const targetResult = await getTargetUser(target, client);

  if (!targetResult.success) {
    return new EmbedBuilder()
      .setColor(Colors.hotPinkPop)
      .setDescription(targetResult.error);
  }

  const { user } = targetResult;
  let gayrate = Math.ceil(Math.random() * 100);

  if (usersToGayRate.includes(user.id)) {
    gayrate = 100;
  }

  const progressBar = gayProgressBar(gayrate);

  return new EmbedBuilder()
    .setColor(Colors.sunshineYellow)
    .setDescription(
      `**${user.username}** is ${gayrate}% gay\n\n${progressBar}`
    );
};

function gayProgressBar(percent: number): string {
  const filledChar = "🏳️‍🌈";
  const emptyChar = "⬜";
  const totalBars = 10;
  const filledBars = Math.round((percent / 100) * totalBars);
  const emptyBars = totalBars - filledBars;

  return filledChar.repeat(filledBars) + emptyChar.repeat(emptyBars);
}
