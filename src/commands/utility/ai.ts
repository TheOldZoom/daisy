import { Message, TextChannel } from "discord.js";
import Command from "../../struct/Command";
import getAIResponse from "../../utils/getAIResponse";

export default new Command({
  name: "ai",
  description: "Talk to an AI.",
  aliases: ["ask"],
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply("Please provide a question for the AI.");
    }

    if (!(message.channel instanceof TextChannel)) {
      return message.reply("This command can only be used in a text channel.");
    }

    const question = args.join(" ");

    try {
      const answer = await getAIResponse(message, client, question);
      if (!answer) return;

      return message.reply(answer);
    } catch (error: any) {
      return message.reply(error);
    }
  },
});
