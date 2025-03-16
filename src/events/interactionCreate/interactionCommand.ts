import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Client from "../../struct/Client";
import Colors from "../../utils/Colors";

export default {
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const commandName = interaction.commandName;
    const command = client.slashCommands.get(commandName);

    if (!command) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("This command no longer exists.")
            .setColor(Colors.hotPinkPop),
        ],
        ephemeral: true,
      });
    }

    if (!interaction.inGuild() && command.guildOnly) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("This command can only be used in servers.")
            .setColor(Colors.hotPinkPop),
        ],
        ephemeral: true,
      });
    }

    const userBlacklist = client.blacklists.get(interaction.user.id);
    if (userBlacklist) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("You are blacklisted from using the bot.")
            .setColor(Colors.hotPinkPop),
        ],
        ephemeral: true,
      });
    }

    if (command.devOnly && interaction.user.id !== client.devId) {
      client.logs.info(
        `${interaction.user.tag} (${interaction.user.id}) tried to execute slash command /${commandName}${
          interaction.guild
            ? ` in guild ${interaction.guild.name} (${interaction.guild.id})`
            : " in DMs"
        }`
      );
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("This command is only available to the bot owner.")
            .setColor(Colors.hotPinkPop),
        ],
        ephemeral: true,
      });
    }

    if (interaction.inGuild()) {
      if (
        command.userPermissions &&
        !interaction.memberPermissions?.has(command.userPermissions)
      ) {
        const missingPermissions = command.userPermissions.filter(
          (perm: any) => !interaction.memberPermissions?.has(perm)
        );
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `You are missing the following permissions: \`${missingPermissions.join(", ")}\``
              )
              .setColor(Colors.hotPinkPop),
          ],
          ephemeral: true,
        });
      }

      if (
        command.botPermissions &&
        !interaction.guild?.members.me?.permissions.has(command.botPermissions)
      ) {
        const missingPermissions = command.botPermissions.filter(
          (perm: any) => !interaction.guild?.members.me?.permissions.has(perm)
        );
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `I am missing the following permissions: \`${missingPermissions.join(", ")}\``
              )
              .setColor(Colors.hotPinkPop),
          ],
          ephemeral: true,
        });
      }
    }

    if (
      command.cooldown &&
      client.cooldowns.has(commandName + interaction.user.id)
    ) {
      const expirationTime = client.cooldowns.get(
        commandName + interaction.user.id
      ) as number;
      const now = Date.now();
      if (now < expirationTime) {
        const timeLeft = Math.floor(expirationTime / 1000);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Please wait <t:${timeLeft}:R> before using this command again.`
              )
              .setColor(Colors.hotPinkPop),
          ],
          ephemeral: true,
        });
      }
    }

    if (command.cooldown) {
      client.cooldowns.set(
        commandName + interaction.user.id,
        Date.now() + command.cooldown * 1000
      );
    }

    client.logs.info(
      `Slash command /${commandName} executed by ${interaction.user.tag} (${interaction.user.id})${
        interaction.guild
          ? ` in guild ${interaction.guild.name} (${interaction.guild.id})`
          : " in DMs"
      }`
    );

    try {
      await command.execute(interaction, client);
    } catch (error) {
      client.logs.error(`Error executing slash command ${commandName}`);
      client.logs.error(error);

      const reply = {
        embeds: [
          new EmbedBuilder()
            .setDescription("Something went wrong while executing the command.")
            .setColor(Colors.hotPinkPop),
        ],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};
