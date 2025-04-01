import { ActivityType } from "discord.js";
import Client from "../structures/Client";

export default (client: Client) => {
  client.logger.info(`Logged in as ${client.user?.username}`);

  client.user?.setPresence({
    activities: [
      {
        name: "Ooooh, wee, Rick!",
        type: ActivityType.Custom,
      },
    ],
  });
};
