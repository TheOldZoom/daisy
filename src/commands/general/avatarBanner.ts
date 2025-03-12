import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js'
import Command from '../../struct/Command'
import Colors from '../../utils/Colors'
import { getUserId } from '../../utils/getUserId'

export default new Command({
  name: 'avatarbanner',
  description: 'Displays the avatar and banner of a user.',
  aliases: ['avba', 'avb'],
  execute: async (message, args, client) => {
    const target = args[0] ? getUserId(args[0]) : message.author.id

    if (!target) return

    const user = await client.users
      .fetch(target, { force: true })
      .catch(() => null)

    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription('User not found.'),
        ],
      })
    }

    const avatarURL = user.displayAvatarURL({ size: 1024 })
    const bannerURL = user.bannerURL({ size: 1024 }) || null

    const avatarEmbed = new EmbedBuilder()
      .setColor(Colors.sunshineYellow)
      .setTitle(`${user.username}'s Avatar`)
      .setImage(avatarURL)

    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Avatar URL')
          .setURL(avatarURL)
          .setDisabled(!avatarURL)
          .setStyle(ButtonStyle.Link)
      )

    if (bannerURL) {
      const bannerEmbed = new EmbedBuilder()
        .setColor(Colors.sunshineYellow)
        .setTitle(`${user.username}'s Banner`)
        .setImage(bannerURL)

      return await message.reply({
        embeds: [avatarEmbed, bannerEmbed],
        components: [
          row.addComponents(
            new ButtonBuilder()
              .setLabel('Banner URL')
              .setURL(bannerURL)
              .setDisabled(!bannerURL)
              .setStyle(ButtonStyle.Link)
          ),
        ],
      })
    }
    await message.reply({ embeds: [avatarEmbed], components: [row] })
  },
})
