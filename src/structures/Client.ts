import "dotenv/config";
import {
  Client as DiscordClient,
  GatewayIntentBits,
  DefaultWebSocketManagerOptions,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Logger } from "./Logger";
import Divider from "../utils/Divider";

// @ts-ignore
DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord Android";

const isDev = process.env.NODE_ENV === "development";

class Client extends DiscordClient {
  public logger = new Logger();

  public constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      allowedMentions: {
        parse: [],
        repliedUser: true,
      },
    });
  }

  private async loadEvents() {
    const eventsDir = join(__dirname, "..", "events");
    const eventFiles = readdirSync(eventsDir);

    eventFiles.forEach(async (file) => {
      const isTsFile = file.endsWith(".ts");
      const isJsFile = file.endsWith(".js");

      if (isTsFile || isJsFile) {
        const event = await import(join(eventsDir, file));
        const eventName = file.replace(".ts", "").replace(".js", "");

        if (typeof event.default === "function") {
          this.logger.info("EVENT", eventName, "loaded");
          this.on(eventName, event.default.bind(null, this));
        } else {
          this.logger.warn("Event", eventName, "is not a function");
        }
      }
    });
  }

  public async start() {
    await this.loadEvents();
    Divider();
    this.login(isDev ? process.env.DEV_TOKEN : process.env.TOKEN);
  }
}

export default Client;
