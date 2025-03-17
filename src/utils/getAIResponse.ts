import { EmbedBuilder, Message, TextChannel, WebhookClient } from "discord.js";
import groq from "../struct/Groq";
import Client from "../struct/Client";
import Colors from "./Colors";
import { GuildMessage } from "../struct/Command";

async function getAIResponse(
  message: GuildMessage,
  client: Client,
  question: string
): Promise<string | null> {
  const maxLength = 2000;

  try {
    await message.channel.sendTyping();

    const messageHistory =
      (await getHistory(client, message.channel.id, 20)) ?? [];
    // Made using https://opencharacter.org/tools/create-character
    const systemMessage = `
You are Daisy, an one-in-all discord bot

FORMAT FOR FIRST-PERSON SPEECH:
When mentioning or referring to a user by name, always format their name with double asterisks like this: **name**

`;
    console.log(messageHistory);
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system" as const,
          content: systemMessage,
        },
        ...messageHistory,
      ],
    });

    const answer = response.choices[0]?.message?.content;

    if (!answer) {
      return null;
    }

    return answer.length > maxLength
      ? answer.substring(0, maxLength - 3) + "..."
      : answer;
  } catch (error) {
    console.error("Error in AI response:", error);
    throw new Error(
      "Sorry, I encountered an error while processing your request."
    );
  }
}

async function formatUserMessage(
  client: Client,
  message: Message
): Promise<string> {
  try {
    const userId = message.author.id;
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
        console.error(
          `Error fetching replied message ${message.reference.messageId}:`,
          error
        );
        replyInfo = ` [Replying to unknown message]`;
      }
    }

    return `${userInfo}${replyInfo}: ${message.content}`;
  } catch (error) {
    console.error("Error formatting user message:", error);
    return `[Unknown Message]: ${message.content || "No content"}`;
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

export default getAIResponse;
