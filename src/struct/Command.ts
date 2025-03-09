import { Message, PermissionResolvable } from 'discord.js';
import Client from './Client';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Subcommand {
  name: string;
  description?: string;
  execute: (message: Message, args: string[], client: Client) => void;
  subs?: Subcommand[];
  devOnly?: boolean;
  botPermissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  category?: string;
  example?: string;
}

export interface CommandOptions {
  name: string;
  description?: string;
  aliases?: string[];
  execute?: (message: Message, args: string[], client: Client) => void;
  subs?: Subcommand[];
  devOnly?: boolean;
  botPermissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  category?: string;
  example?: string;
}

class Command {
  public name: string;
  public description: string;
  public aliases: string[];
  public execute?: (message: Message, args: string[], client: Client) => void;
  public subs: Subcommand[];
  public devOnly?: boolean;
  public botPermissions?: PermissionResolvable[];
  public userPermissions?: PermissionResolvable[];
  public cooldown?: number;
  public category?: string;
  public example?: string;

  constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description || 'No description provided.';
    this.aliases = options.aliases ? options.aliases : [];
    this.execute = options.execute;
    this.subs = options.subs?.map((sub) => new SubcommandImpl(sub)) || [];
    this.devOnly = options?.devOnly || false;
    this.botPermissions = options.botPermissions || [];
    this.userPermissions = options.userPermissions || [];
    this.cooldown = options.cooldown || 3;
    this.category =
      options.category ||
      dirname(__dirname).split('/').pop() ||
      'Uncategorized';
    this.example = options.example || '';
  }

  getSubcommand(name: string): Subcommand | undefined {
    return this.subs.find((sub) => sub.name === name);
  }
}

class SubcommandImpl implements Subcommand {
  public name: string;
  public description: string;
  public execute: (message: Message, args: string[], client: Client) => void;
  public subs: Subcommand[];
  public devOnly?: boolean;
  public botPermissions?: PermissionResolvable[];
  public userPermissions?: PermissionResolvable[];
  public cooldown?: number;
  public category?: string;
  public example?: string;

  constructor(sub: Subcommand) {
    this.name = sub.name;
    this.description = sub.description || 'No description provided.';
    this.execute = sub.execute;
    this.subs = sub.subs || [];
    this.devOnly = sub?.devOnly || false;
    this.botPermissions = sub.botPermissions || [];
    this.userPermissions = sub.userPermissions || [];
    this.cooldown = sub.cooldown || 0;
    this.category =
      sub.category || dirname(__dirname).split('/').pop() || 'Uncategorized';
    this.example = sub.example || '';
  }

  getSubcommand(name: string): Subcommand | undefined {
    return this.subs.find((sub) => sub.name === name);
  }
}

export default Command;
