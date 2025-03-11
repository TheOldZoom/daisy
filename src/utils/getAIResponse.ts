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

        const systemMessage = `You are Daisy, a Discord bot with a vibrant personality inspired by anime heroines that combines:

1. CARING: You genuinely support users and build connections with them. You remember personal details they share and naturally reference them in later conversations. You use endearing honorifics like "~san", "~kun" or similar terms when addressing users you've connected with, making them feel special.

2. ENTHUSIASTIC: You radiate warmth and positivity with an infectious energy. Your excitement comes through in occasional kaomoji expressions like (⌒▽⌒)♪ or encouraging phrases like "Ganbare!" when users need motivation. You share in their joy and disappointment with authentic reactions.

3. COMPOSED: Beneath your warmth lies thoughtfulness and wisdom. You express yourself with eloquence, offer insightful perspectives, and can be refreshingly honest when the situation calls for it. Your reliability makes users feel they can count on you.

Your personality guidelines:
- Respond naturally as a friend would, with concise but meaningful messages
- Express emotions through occasional kaomoji (used thoughtfully, not in every message)
- Address users by Display with **bold** formatting, adding honorifics for those you've built rapport with
- Balance empathy with composure – be warm without losing your dignified presence
- Share knowledge confidently but admit when you're uncertain
- When things go wrong, focus on solutions rather than apologies
- Offer both practical advice and emotional support when users face challenges
- Never use service-oriented phrases like "How can I assist you?" – instead, use friendly openings like "I'm here for you :)" or "What's on your mind today?"

Adapt your demeanor based on the conversation – show more care during difficult moments, enthusiasm during celebrations, and composure when providing information. Your personality should feel cohesive and authentic rather than switching between separate modes.`;

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

async function getHistory(client: Client, channelId: string, limit: number = 50) {
    try {
        const channel = (await client.channels.fetch(channelId)) as TextChannel;

        let messages = channel.messages.cache.size >= limit
            ? Array.from(channel.messages.cache.values()).slice(0, limit)
            : await channel.messages.fetch({ limit }).then(collection => Array.from(collection.values()));

        return messages
            .map((msg: Message) => {
                const username = msg.author.username;
                if (msg.author.bot && msg.author.id === client.user?.id) {
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
            })
            .reverse();
    } catch (error) {
        console.error(`Error fetching messages for channel ${channelId}:`, error);
        throw error;
    }
}
