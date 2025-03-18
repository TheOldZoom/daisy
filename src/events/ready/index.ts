import chalk from "chalk";
import Client from "../../struct/Client";
import prisma from "../../struct/Prisma";
import { guild, user } from "@prisma/client";
import { ActivityType } from "discord.js";

export default async (client: Client) => {
  client.logs.log(
    `Successfully logged in as ${chalk.blue(client.user?.username ?? "Unknown")}`
  );
  logDivider();

  // Load users from the database
  const users = await prisma.user.findMany();
  client.logs.info(
    `Successfully loaded ${users.length} user(s) from the database.`
  );
  client.logs.info("Initializing user data...");
  await loadUsers(client, users);
  client.logs.info("User data loaded successfully.");
  logDivider();

  // Load guilds from the database
  const guilds = await prisma.guild.findMany();
  client.logs.info(
    `Successfully loaded ${guilds.length} guild(s) from the database.`
  );
  client.logs.info("Initializing guild data...");
  await loadGuilds(client, guilds);
  client.logs.info("Guild data loaded successfully.");
  logDivider();

  // Start updating bot's presence status
  presence(client);
};

async function loadUsers(client: Client, users: user[]) {
  for (const u of users) {
    if (!u.selfprefix || u.blacklistedSince) continue;
    client.logs.info(`Loaded self prefix "${u.selfprefix}" for user ${u.id}`);
    client.prefixes.set(u.id, u.selfprefix);
  }

  // Load blacklist data for users
  for (const u of users) {
    if (!u.blacklistedSince) continue;
    client.logs.debug(`Loaded blacklist for user ${u.id}`);
    client.blacklists.set(u.id, u.blacklistedSince);
  }
}

async function loadGuilds(client: Client, storedGuilds: guild[]) {
  const storedGuildMap = new Map(storedGuilds.map((g) => [g.id, g]));

  for (const guild of client.guilds.cache.values()) {
    const id = guild.id;
    client.logs.info(`Processing guild: ${guild.name} (${id})...`);

    let storedGuild = storedGuildMap.get(id);

    if (!storedGuild) {
      client.logs.info(`Adding missing guild ${id} to the database.`);
      await prisma.guild.create({
        data: {
          id,
          name: guild.name,
          prefix: null,
          blacklistedSince: null,
          icon: guild.icon,
          ownerId: guild.ownerId,
          systemChannelId: guild.systemChannelId,
          levelingEnabled: true,
          welcomeEnabled: false,
          automodEnabled: false,
        },
      });
      client.logs.info(`Guild ${id} added to the database.`);
    } else {
      const updates: Record<string, any> = {};

      if (guild.name !== storedGuild.name) updates.name = guild.name;
      if (guild.icon !== storedGuild.icon) updates.icon = guild.icon;
      if (guild.ownerId !== storedGuild.ownerId)
        updates.ownerId = guild.ownerId;
      if (guild.systemChannelId !== storedGuild.systemChannelId)
        updates.systemChannelId = guild.systemChannelId;
      if (storedGuild.lastSeenAt) updates.lastSeenAt = null;

      if (Object.keys(updates).length > 0) {
        client.logs.info(`Updating guild ${id} with new data:`);
        Object.entries(updates).forEach(([key, value]) => {
          client.logs.info(`   - ${key}: ${value}`);
        });

        await prisma.guild.update({ where: { id }, data: updates });
        client.logs.info(`Guild ${id} updated successfully.`);
      } else {
        client.logs.info(`Guild ${id} is already up-to-date.`);
      }
    }

    // Load guild prefix
    if (storedGuild?.prefix && !storedGuild.blacklistedSince) {
      client.logs.info(`Loaded prefix "${storedGuild.prefix}" for guild ${id}`);
      client.prefixes.set(id, storedGuild.prefix);
    }

    if (typeof logDivider === "function") logDivider();
  }

  // Check if any stored guilds have left the server
  for (const [id, g] of storedGuildMap) {
    const guild = client.guilds.cache.get(id);

    if (!g.lastSeenAt && !guild) {
      await prisma.guild.update({
        where: { id },
        data: { lastSeenAt: new Date() },
      });
      client.logs.info(`${g.name} (${g.id}) has left us - lastSeenAt updated.`);
    }
  }
}

function logDivider() {
  console.log(chalk.blue("-".repeat(75)));
}

export function processStatus(
  status: { text: string; type: string; url?: string },
  client: Client
): string {
  let processedStatus = status.text;
  processedStatus = processedStatus.replace(
    /{guilds\.size}/g,
    client.guilds.cache.size.toString()
  );
  const totalUsers = client.guilds.cache
    .reduce((acc, guild) => acc + guild.memberCount, 0)
    .toString();
  processedStatus = processedStatus.replace(/{users\.size}/g, totalUsers);
  processedStatus = processedStatus.replace(
    /{time}/g,
    formatUptime(client.uptime)
  );
  processedStatus = processedStatus.replace(
    /{epm}/g,
    String(client.eventPerMinutes())
  );
  return processedStatus;
}

async function presence(client: Client) {
  let lastStatus: string | null = null;

  const updateStatus = async () => {
    try {
      const statuses = await prisma.status.findMany();
      if (statuses.length === 0) {
        client.logs.warn("No statuses found in the database.");
        return;
      }

      const shuffledStatuses = statuses.sort(() => 0.5 - Math.random());
      const randomStatus = shuffledStatuses[0];

      // Avoid repeating the same status
      if (randomStatus.text === lastStatus) {
        return setTimeout(updateStatus, 15 * 1000);
      }

      const processedStatus = processStatus(
        {
          text: randomStatus.text,
          type: randomStatus.type,
          url: randomStatus.url || undefined,
        },
        client
      );

      const activityOptions: { type: ActivityType; url?: string } = {
        type: getActivityType(randomStatus.type),
        url: randomStatus.url || "https://www.twitch.tv/TheOldZoom",
      };

      client.user?.setActivity(processedStatus, activityOptions);
      client.logs.debug(
        `Bot status updated to: "${processedStatus}" (${randomStatus.type})`
      );

      lastStatus = randomStatus.text;

      setTimeout(updateStatus, 15 * 1000);
    } catch (error) {
      console.error(chalk.red(`[STATUS] Error updating status: ${error}`));
    }
  };

  client.logs.info("Status updater initialized and running.");
  await updateStatus();
}

function getActivityType(type: string): ActivityType {
  switch (type) {
    case "Streaming":
      return ActivityType.Streaming;
    case "Custom":
      return ActivityType.Custom;
    default:
      return (
        ActivityType[type as keyof typeof ActivityType] || ActivityType.Playing
      );
  }
}

function formatUptime(uptime: number | null): string {
  if (!uptime) return "Unknown";

  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes >= 1) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
}
