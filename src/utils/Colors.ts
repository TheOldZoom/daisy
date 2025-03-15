import { ColorResolvable } from "discord.js";

interface Colors {
  sweetPink: ColorResolvable;
  sakuraBlush: ColorResolvable;
  sunshineYellow: ColorResolvable;
  dreamyLavender: ColorResolvable;
  boldCoral: ColorResolvable;
  skyHighBlue: ColorResolvable;
  mintyFresh: ColorResolvable;
  pureWhite: ColorResolvable;
  hotPinkPop: ColorResolvable;
  denimChic: ColorResolvable;
}

const Colors: Colors = {
  sweetPink: "#F5A5C0",
  sakuraBlush: "#FFB7C5",
  sunshineYellow: "#FFEB99",
  dreamyLavender: "#B69DE4",
  boldCoral: "#FF6F61",
  skyHighBlue: "#64B5F6",
  mintyFresh: "#A5D6A7",
  pureWhite: "#F9F9F9",
  hotPinkPop: "#F50057",
  denimChic: "#3E4A89",
};

function getRandomColor(): ColorResolvable {
  const colorKeys = Object.keys(Colors);
  const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  return Colors[randomKey as keyof Colors];
}

export default Colors;
export { getRandomColor };
