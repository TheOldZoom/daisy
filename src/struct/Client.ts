import { ClientOptions, Collection, Client as DiscordClient } from "discord.js";
import { Logger } from "./Logger";
import fs from "fs";
import path from "path";

class Client extends DiscordClient {
  public logs: Logger;
  public commands: Collection<string, any>;
  public events: Collection<string, any>;
  public prefixes: Collection<string, string>;
  public devId: string = "1041378399005978624";
  public cooldowns: Collection<string, number>;
  public blacklists: Collection<string, Date>;
  public prefix: string;
  constructor(options: ClientOptions) {
    super(options);
    this.logs = new Logger({
      debug: process.env.NODE_ENV === "development",
    });
    this.commands = new Collection();
    this.events = new Collection();
    this.prefixes = new Collection();
    this.cooldowns = new Collection();
    this.blacklists = new Collection();
    this.prefix = "d.";
  }

  async loadCommands(commandsPath?: string) {
    const resolvedPath = commandsPath ?? path.join(__dirname, "../commands");

    try {
      const commandFiles: string[] = [];

      const getFiles = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            getFiles(filePath);
          } else if (file.endsWith(".ts") || file.endsWith(".js")) {
            commandFiles.push(filePath);
          }
        }
      };

      getFiles(resolvedPath);

      if (commandFiles.length === 0) {
        this.logs.warn("No command files found.");
      }

      for (const filePath of commandFiles) {
        const command = await import(filePath);

        const commandModule = command.default || command;

        if ("name" in commandModule && "execute" in commandModule) {
          this.commands.set(commandModule.name, commandModule);
          this.logs.info(`COMMAND ${commandModule.name} loaded`);
        } else {
          this.logs.warn(`Invalid command module in file: ${filePath}`);
        }
      }
    } catch (error) {
      this.logs.error(
        "Error loading commands",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async loadEvents(eventsPath?: string) {
    const resolvedPath = eventsPath ?? path.join(__dirname, "../events");

    try {
      const eventFolders = fs
        .readdirSync(resolvedPath)
        .filter((folder) =>
          fs.statSync(path.join(resolvedPath, folder)).isDirectory()
        );

      if (eventFolders.length === 0) {
        this.logs.warn("No event folders found.");
      }

      for (const eventFolder of eventFolders) {
        const eventPath = path.join(resolvedPath, eventFolder);
        const eventFiles = fs
          .readdirSync(eventPath)
          .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

        const eventHandlers: Function[] = [];

        for (const file of eventFiles) {
          const filePath = path.join(eventPath, file);
          const eventModule = await import(filePath);
          this.logs.info(`EVENT ${eventFolder} loaded`);
          const handler =
            eventModule.default?.execute ||
            eventModule.execute ||
            eventModule.default;

          if (typeof handler === "function") {
            eventHandlers.push(handler);
          } else {
            this.logs.warn(`No handler found in file: ${file}`);
          }
        }

        if (eventHandlers.length > 0) {
          this.on(eventFolder, (...args) => {
            eventHandlers.forEach((handler) => {
              try {
                handler(...args, this);
              } catch (error) {
                this.logs.error(
                  `Error in ${eventFolder} event handler`,
                  error instanceof Error ? error.message : String(error)
                );
              }
            });
          });

          this.events.set(eventFolder, eventHandlers);
        } else {
          this.logs.warn(`No valid handlers in folder: ${eventFolder}`);
        }
      }
    } catch (error) {
      this.logs.error(
        "Error loading events",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async initialize(options?: { commandsPath?: string; eventsPath?: string }) {
    await this.loadCommands(options?.commandsPath);
    try {
      await this.loadEvents(options?.eventsPath);
    } catch (error) {
      this.logs.error("Error during event loading");
      this.logs.error(String(error));
    }
  }
}

export default Client;
