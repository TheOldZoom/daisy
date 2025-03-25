import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import Slash from "../../struct/Slash";
import Colors from "../../utils/Colors";
import escapeMarkdown from "../../utils/escapeMarkdown";

const DISCORD_EMBED_LIMIT = 4069;

export default new Slash({
  data: new ContextMenuCommandBuilder()
    .setName(`Message`)
    .setType(ApplicationCommandType.Message)
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  async execute(interaction, client) {
    if (!("targetMessage" in interaction)) return;

    const targetMessage = interaction.targetMessage;
    const messageData = JSON.stringify(targetMessage.toJSON(), null, 2);
    const escapedData = escapeMarkdown(messageData);

    const chunks = [];
    for (let i = 0; i < escapedData.length; i += DISCORD_EMBED_LIMIT - 8) {
      chunks.push(escapedData.slice(i, i + DISCORD_EMBED_LIMIT - 8));
    }

    const firstEmbed = new EmbedBuilder()
      .setColor(Colors.denimChic)
      .setDescription(`\`\`\`json\n${chunks[0]}\`\`\``);

    if (chunks.length > 1) {
      firstEmbed.setFooter({ text: `Part 1/${chunks.length}` });
    }

    await interaction.reply({ embeds: [firstEmbed], flags: 64 });

    for (let i = 1; i < chunks.length; i++) {
      const embed = new EmbedBuilder()
        .setColor(Colors.denimChic)
        .setDescription(`\`\`\`json\n${chunks[i]}\`\`\``)
        .setFooter({ text: `Part ${i + 1}/${chunks.length}` });

      await interaction.followUp({ embeds: [embed], flags: 64 });
    }
  },
});
