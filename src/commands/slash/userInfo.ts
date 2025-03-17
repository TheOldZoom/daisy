import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import Slash from "../../struct/Slash";
import userInfo from "../../inters/userInfo";
import Colors from "../../utils/Colors";

export default new Slash({
  data: new SlashCommandBuilder()
    .setName(`user`)
    .setDescription(`Get user's information`)
    .addUserOption((o) =>
      o.setName(`user`).setDescription("The user to get the information from.")
    ),
  async execute(interaction, client) {
    if (!(interaction instanceof ChatInputCommandInteraction)) return;

    const target = interaction.options.getUser("user") || interaction.user;
    if (!target) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription(`The user was not found`),
        ],
      });
    }

    await interaction.deferReply();
    await interaction.followUp(await userInfo(client, target.id));
  },
});
