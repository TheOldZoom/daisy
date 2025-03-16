import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Slash from "../../struct/Slash";
import Colors from "../../utils/Colors";
import gayRate from "../../inters/gayRate";

export default new Slash({
  data: new SlashCommandBuilder()
    .setName(`gay`)
    .setDescription(`Replies with a user's gayrate`)
    .addUserOption((o) =>
      o.setName(`user`).setDescription("The user to get the gayrate from")
    )
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1) as SlashCommandBuilder,
  async execute(interaction, client) {
    const target = interaction.options?.getUser("user") || interaction.user;

    const embed = await gayRate(client, target.id);
    await interaction.reply({ embeds: [embed] });
  },
});
