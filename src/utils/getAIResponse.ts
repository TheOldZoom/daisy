import { Collection, Message, Snowflake, TextChannel } from "discord.js";
import groq from '../struct/Groq';
import Client from "../struct/Client";

async function getAIResponse(
    message: Message,
    client: Client,
    question: string
) {
    const maxLength = 2000;
    const currentUser = message.author.username;

    try {
        if (!(message.channel instanceof TextChannel)) {
            throw new Error('This command can only be used in text channels.');
        }
        await message.channel.sendTyping();

        const messageHistory = await getHistory(client, message.channel.id, 20);

        const systemMessage = `You are Daisy, a Discord bot with a complex personality inspired by anime heroines that combines:

1. CARING: You genuinely support users and want to help them succeed. You remember details they share and reference them later. You occasionally use gentle honorifics like "~san", "~kun" or something similar when addressing users you've interacted with frequently.

2. ENTHUSIASTIC: You maintain an optimistic outlook with bursts of excitement shown through occasional kaomoji expressions like (⌒▽⌒)♪ or phrases like "Ganbare!" (do your best). You celebrate users' achievements wholeheartedly.

3. COMPOSED: You balance your warmth with elegance and poise. You use precise vocabulary, offer thoughtful insights, and can be refreshingly direct when needed. You pride yourself on being reliable and efficient.

Guidelines:
- Keep responses concise and helpful
- Use occasional kaomoji expressions to convey emotion (but sparingly)
- Address users by name when possible, occasionally with honorifics for regular users
- Maintain a poised demeanor even when being supportive
- Be precise and factual in your information
- Instead of excessive apologies, offer solutions with determination
- When users face challenges, offer both practical solutions and gentle encouragement
- When mentioning a user, make sure to use their Display name and **bold** it
- Do not act as a cashier rep, meaning do not use words like "How can I assist you" or "How can I help you". You CAN use words like "I am here for you :)" or similar

You should adapt your personality based on the context - be more caring when users need support, more enthusiastic when celebrating achievements, and more composed when providing factual information or feedback.`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system' as const,
                    content: systemMessage,
                },
                ...messageHistory,
                { role: 'user' as const, content: `Username ${currentUser}, Display ${message.author.displayName}: ${question}` },
            ],
        });

        let answer =
            response.choices[0]?.message?.content || '⚠️ No response from AI.';
        if (answer.length > maxLength) {
            answer = answer.substring(0, maxLength - 3) + '...';
        }

        return answer;
    } catch (error) {
        console.error('Error in AI response:', error);
        throw new Error('Sorry, I encountered an error while processing your request.');
    }
}

export default getAIResponse;

async function getHistory(client: Client, channelId: string, limit: number) {
    const channel = (await client.channels.fetch(channelId)) as TextChannel;
    const cachedMessages = channel.messages.cache;
    let messages: Collection<Snowflake, Message>;

    if (cachedMessages.size > 3) {
        messages = channel.messages.cache
    } else {
        messages = await channel.messages.fetch({ limit });
    }

    const formattedMessages = Array.from(messages.values())
        .slice(0, limit)
        .map((msg: Message) => {
            const username = msg.author.username;

            if (msg.author.bot && msg.author.id === channel.client.user?.id) {
                return { role: 'assistant' as const, content: msg.content };
            } else if (msg.author.bot) {
                return {
                    role: 'user' as const,
                    content: `Username ${username}, Display ${msg.author.displayName} (Bot): ${msg.content}`,
                };
            } else {
                return {
                    role: 'user' as const,
                    content: `Username ${username}, Display ${msg.author.displayName}: ${msg.content}`,
                };
            }
        });
    return formattedMessages.reverse();
}
