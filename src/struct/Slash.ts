import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import Client from "./Client";

export interface SlashOptions {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => void;

  cooldown?: number;
}

class Slash {
  public data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  public execute: (
    interaction: ChatInputCommandInteraction,
    client: Client
  ) => void;
  public cooldown: number;

  constructor(options: SlashOptions) {
    this.data = options.data;
    this.execute = options.execute;
    this.cooldown = options.cooldown || 3;
  }

  public toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    return this.data.toJSON();
  }
}

export default Slash;
