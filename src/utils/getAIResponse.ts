import gemini from "../struct/Gemini";
import { GuildMessage } from "../struct/Command";
import Client from "../struct/Client";
import { Message, TextChannel } from "discord.js";

type QueueItem = {
  message: GuildMessage;
  client: Client;
  question: string;
  resolve: (value: string | null | PromiseLike<string | null>) => void;
  reject: (reason?: any) => void;
};

class AIRequestQueue {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 2;
  private activeRequests: number = 0;
  private cooldownMap: Map<string, number> = new Map();
  private userCooldown: number = 3000;

  enqueue(item: QueueItem): void {
    const userId = item.message.author.id;
    const now = Date.now();
    const lastRequest = this.cooldownMap.get(userId) || 0;

    if (now - lastRequest < this.userCooldown) {
      item.reject(`Please wait before making another request.`);
      return;
    }

    this.queue.push(item);
    this.cooldownMap.set(userId, now);

    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.activeRequests >= this.maxConcurrent) {
      if (this.queue.length === 0 && this.activeRequests === 0) {
        this.processing = false;
      }
      return;
    }

    this.processing = true;
    this.activeRequests++;

    const item = this.queue.shift()!;

    try {
      const typingPromise = item.message.channel.sendTyping();

      const response = await this.processAIRequest(
        item.client,
        item.message,
        item.question
      );

      await typingPromise.catch((err) =>
        console.error("Typing indicator error:", err)
      );

      item.resolve(response);
    } catch (error) {
      console.error("Error processing queue item:", error);
      item.reject(error);
    } finally {
      this.activeRequests--;

      setTimeout(() => this.processQueue(), 100);
    }
  }

  private async processAIRequest(
    client: Client,
    message: GuildMessage,
    question: string
  ): Promise<string | null> {
    const maxLength = 2000;

    try {
      const messageHistory =
        (await getHistory(client, message.channel.id, 20)) ?? [];
      const systemMessage = `
You are Daisy, an all-in-one Discord bot & open source bot, at https://github.com/TheOldZoom/daisy.

When mentioning or referring to a user by name, always format their name with double asterisks like this: **name**
`;

      const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

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
}

const aiQueue = new AIRequestQueue();

async function getAIResponse(
  message: GuildMessage,
  client: Client,
  question: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    aiQueue.enqueue({
      message,
      client,
      question,
      resolve,
      reject,
    });
  });
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
