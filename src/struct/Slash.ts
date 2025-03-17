import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  InteractionResponse,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import Client from "./Client";

type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | ContextMenuCommandBuilder;

export type CommandInteraction =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction;

export interface SlashOptions {
  data: SlashCommandData;
  execute: (
    interaction: CommandInteraction,
    client: Client
  ) => Promise<InteractionResponse | void> | void;
  cooldown?: number;
}

class Slash {
  public data: SlashCommandData;
  public execute: (
    interaction: CommandInteraction,
    client: Client
  ) => Promise<InteractionResponse | void> | void;
  public cooldown: number;

  constructor(options: SlashOptions) {
    this.data = options.data;
    this.execute = options.execute;
    this.cooldown = options.cooldown || 3;
  }
}

export default Slash;
