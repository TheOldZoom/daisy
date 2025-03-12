import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js'
import Command from '../../struct/Command'
import Colors from '../../utils/Colors'

export default new Command({
  name: 'invite',
  description: 'Replies with the invite',
  execute(message, args, client) {
    message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.sunshineYellow)
          .setDescription(`**Invite ${client.user} now!**`),
      ],
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setLabel(`Invite ${client.user?.username}`)
            .setStyle(ButtonStyle.Link)
            .setURL(
              `https://discord.com/oauth2/authorize?client_id=${client.user?.id}`
            )
        ),
      ],
    })
  },
})
