import { Message } from "discord.js";
import Client from "./Client";

export interface Subcommand {
    name: string;
    description?: string;
    execute: (message: Message, args: string[], client: Client) => Promise<void>;
    subs?: Subcommand[];
}

export interface CommandOptions {
    name: string;
    description?: string;
    aliases?: string[];
    execute: (message: Message, args: string[], client: Client) => Promise<void>;
    subs?: Subcommand[];
}

class Command {
    public name: string;
    public description: string;
    public aliases: string[]
    public execute: (message: Message, args: string[], client: Client) => Promise<void>;
    public subs: Subcommand[];

    constructor(options: CommandOptions) {
        this.name = options.name;
        this.description = options.description || "No description provided.";
        this.aliases = options.aliases ? options.aliases : [];
        this.execute = options.execute;

        this.subs = options.subs?.map(sub => new SubcommandImpl(sub)) || [];
    }

    getSubcommand(name: string): Subcommand | undefined {
        return this.subs.find(sub => sub.name === name);
    }
}


class SubcommandImpl implements Subcommand {
    public name: string;
    public description: string;
    public execute: (message: Message, args: string[], client: Client) => Promise<void>;
    public subs: Subcommand[];

    constructor(sub: Subcommand) {
        this.name = sub.name;
        this.description = sub.description || "No description provided.";
        this.execute = sub.execute;
        this.subs = sub.subs || [];
    }

    getSubcommand(name: string): Subcommand | undefined {
        return this.subs.find(sub => sub.name === name);
    }
}


export default Command;
