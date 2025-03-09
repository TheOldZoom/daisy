import { TextChannel } from "discord.js";
import Command from "../../struct/Command";
import groq from "../../struct/Groq";

export default new Command({
    name: "ai",
    description: "Talk to an AI.",
    devOnly: true,
    aliases: ["ask"],

    async execute(message, args, client) {
        if (!args.length) {
            return message.reply("Please provide a question for the AI.");
        }

        const question = args.join(" ");

        try {
            if (!(message.channel instanceof TextChannel)) {
                return message.reply("This command can only be used in a text channel.");
            }
            message.channel.sendTyping();
            const fullPrompt = `${question}`;
            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: 'user', content: fullPrompt,
                    },
                    {
                        role: "system", content: "Please provide a response that is no longer than 2,000 characters.",
                    }
                ],

            })
            let answer = response.choices[0]?.message?.content || '⚠️ No response from AI.';
            answer = answer.replace(/@/g, '@\u200B');

            const maxLength = 2000;
            if (answer.length > maxLength) {
                answer = answer.slice(0, maxLength);
            }
            return message.reply(answer);
        } catch (error) {
            return message.reply("Sorry, I encountered an error while processing your request.");
        }
    }
});