import { GuildMember } from "discord.js";
import Client from "../struct/Client";

export default async (guildId: string, userId: string, client: Client) => {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  let member = guild.members.cache.get(userId);

  if (!member) {
    try {
      member = await guild.members.fetch(userId);
    } catch (error) {
      console.error("Failed to fetch member:", error);
      return null;
    }
  }

  return member as GuildMember;
};
