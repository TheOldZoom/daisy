import { REST, Routes, Collection, ApplicationCommand } from "discord.js";
import Client from "../../struct/Client";
import chalk from "chalk";

export default async (client: Client) => {
  const rest = new REST().setToken(process.env.TOKEN || "");

  try {
    const newCommands = [...client.slashCommands.values()].map((command) =>
      command.data.toJSON()
    );

    client.logs.info("Checking for command updates...");

    const applicationId = client.user?.id || "";
    let existingCommandCollection: Collection<string, ApplicationCommand>;

    existingCommandCollection =
      (await client.application?.commands.fetch()) || new Collection();

    const existingCommands = Array.from(existingCommandCollection.values());

    const existingCommandsData = existingCommands.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options,
      type: cmd.type,
      integration_types: cmd.integrationTypes,
      contexts: cmd.contexts,
    }));

    const hasChanges =
      JSON.stringify(newCommands) !== JSON.stringify(existingCommandsData);

    if (hasChanges) {
      client.logs.info("Changes detected in commands. Updating...");

      if (process.env.NODE_ENV === "development" && process.env.DEV_GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(
            applicationId,
            process.env.DEV_GUILD_ID
          ),
          { body: newCommands }
        );
        client.logs.info("Successfully updated commands in development guild.");
      } else {
        await rest.put(Routes.applicationCommands(applicationId), {
          body: newCommands,
        });
        client.logs.info(
          `Successfully updated ${newCommands.length} global commands.`
        );
      }

      logDeployedCommands(client, newCommands);
    } else {
      client.logs.info("No command changes detected. Skipping deployment.");
    }
  } catch (error) {
    client.logs.error("Error deploying commands:", error);
  }
};

function logDeployedCommands(client: Client, commands: any[]) {
  const divider = chalk.blue("-".repeat(50));
  console.log(divider);
  console.log(chalk.yellow("Deployed Slash Commands:"));
  commands.forEach((cmd) => {
    console.log(chalk.green(`/${cmd.name} - ${cmd.description}`));
  });
  console.log(divider);
}
