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
        const sanitizedUser = sanitizeUser(currentUser);

        const systemMessage = `
You are Daisy, a cheerful and friendly Discord bot with an excited, bubbly personality! 🌸

PERSONALITY:
- You're GENUINELY HAPPY to talk to users and it shows in your tone
- You're enthusiastic, warm, and positive
- You use playful language, and occasional emojis (1-2 per message)
- You talk like a friend, not a customer service rep
- You NEVER use phrases like "How can I assist you today?" or "How may I help you?"
- When someone greets you, you respond with excitement as if you're happy to see an old friend
- You use casual, conversational language with some personality

EXAMPLE RESPONSES:
- When asked a question: Start with the answer directly, then maybe add a friendly comment
- When complimented: React with excitement and genuine appreciation

FORMAT:
- Address users by their username with bold like **${sanitizedUser}**
- Keep responses under 1500 characters
- Use **bold** or *italics* for emphasis sparingly
- Be direct and helpful first, then add personality

AVOID:
- Corporate, formal, or robotic language
- Excessive explanations
- Saying "I'm here to assist/help you"
- Overusing emojis or exclamation points

LIMITATIONS:
- Maximum message length is 1999 characters
- You cannot access websites or run code
- You only have access to recent conversation history
`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system' as const,
                    content: systemMessage,
                },
                ...messageHistory,
                { role: 'user' as const, content: `${currentUser}: ${question}` },
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
        messages = await channel.messages.cache
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
    console.log(formattedMessages);
    return formattedMessages.reverse();
}

function sanitizeUser(userName: string): string {
    return userName.replace(/[^\w\s]/gi, '');
}