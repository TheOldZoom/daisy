import gemini from "../struct/Gemini";
import { GuildMessage } from "../struct/Command";
import Client from "../struct/Client";
import { Message, TextChannel } from "discord.js";

async function getAIResponse(
  message: GuildMessage,
  client: Client,
  question: string
): Promise<string | null> {
  const maxLength = 2000;

  // Get message history
  const messageHistory = await getHistory(client, message.channel.id, 20);
  const systemMessage = `
You are Daisy (Discord username: Daisy & discord id: 1343784530921787462)`;

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
  if (!messageHistory) return null;
  const messages = [
    {
      role: "user",
      parts: [{ text: systemMessage }],
    },
    ...messageHistory
      .filter((msg) => msg.content && msg.content.trim() !== "")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
  ];

  try {
    const result = await model.generateContent({
      contents: messages,
    });

    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (!responseText) {
      console.warn("Received empty response from AI");
      return null;
    }

    return responseText.length > maxLength
      ? responseText.substring(0, maxLength - 3) + "..."
      : responseText;
  } catch (error) {
    console.error("Error in AI response:", error);
    return null;
  }
}

async function getHistory(
  client: Client,
  channelId: string,
  limit: number = 50
) {
  try {
    const channel = (await client.channels.fetch(channelId)) as TextChannel;
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    let messages: Message[] = [];
    try {
      messages = await channel.messages
        .fetch({ limit })
        .then((collection) => Array.from(collection.values()));
    } catch (error) {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
      return [];
    }

    const formattedMessages = [];

    for (const msg of messages) {
      try {
        const isReplyToBot =
          msg.reference?.messageId &&
          (await channel.messages.fetch(msg.reference.messageId)).author.id ===
            client.user?.id;

        if (!client.user?.id) return;
        const isMentioningBot = msg.mentions.has(client.user?.id);

        if (isReplyToBot || isMentioningBot) {
          formattedMessages.push({
            role: "user" as const,
            content: await formatUserMessage(client, msg),
          });
        } else if (msg.author.bot && msg.author.id === client.user?.id) {
          formattedMessages.push({
            role: "assistant" as const,
            content: msg.content,
          });
        }
      } catch (error) {
        console.error(`Error processing message ${msg.id}:`, error);
      }
    }

    return formattedMessages.reverse();
  } catch (error) {
    console.error(`Error in getHistory for channel ${channelId}:`, error);
    return [];
  }
}

async function formatUserMessage(
  client: Client,
  message: Message
): Promise<string> {
  try {
    let username = "Unknown";
    let isWebhook = false;

    if (message.webhookId) {
      isWebhook = true;
      username = message.author.username || "Username";
    } else {
      username = message.author.username || "Unknown User";
    }

    let userInfo = isWebhook
      ? `[Username:${username}]`
      : `[Username:${username}]`;

    let replyInfo = "";
    if (message.reference && message.reference.messageId) {
      try {
        const repliedTo = await message.channel.messages
          .fetch(message.reference.messageId)
          .catch(() => null);

        if (repliedTo) {
          let repliedToName = "Unknown";
          let repliedToId = "unknown";

          if (repliedTo.webhookId) {
            repliedToName = repliedTo.author.username || "Username";
            repliedToId = "Username";
          } else {
            repliedToName = repliedTo.author.username || "Unknown User";
            repliedToId = repliedTo.author.id;
          }

          replyInfo = ` [Replying to ${repliedToName}${repliedToId !== "Username" ? `(${repliedToId.slice(-4)})` : ""}]`;
        } else {
          replyInfo = ` [Replying to unknown message]`;
        }
      } catch (error) {
        replyInfo = ` [Replying to unknown message]`;
      }
    }

    return `${userInfo}${replyInfo}: ${message.content}`;
  } catch (error) {
    console.error("Error formatting user message:", error);
    return `[Unknown Message]: ${message.content || "No content"}`;
  }
}

export default getAIResponse;
