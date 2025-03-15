import { Message, TextChannel, EmbedBuilder } from 'discord.js'
import Command from '../../struct/Command'
import { inspect } from 'util'

export default new Command({
  name: 'eval',
  description: 'Evaluates TypeScript code. Developer only.',
  aliases: ['ev', 'evaluate'],
  devOnly: true,
  async execute(message: Message, args: string[], client: any) {
    if (!args.length) {
      return message.reply('Please provide code to evaluate.')
    }

    if (!(message.channel instanceof TextChannel)) {
      return message.reply('This command can only be used in a text channel.')
    }

    const code = args.join(' ')
    let startTime = process.hrtime()

    try {
      const evaluatedCode = new Function(
        'message',
        'client',
        'args',
        `
        try {
          const result = (async () => { ${code} })();
          return result;
        } catch (err) {
          throw err;
        }
        `
      )

      const result = await evaluatedCode(message, client, args)
      const execTime = process.hrtime(startTime)
      const execTimeMs = (execTime[0] * 1000 + execTime[1] / 1000000).toFixed(2)

      const formattedResult =
        typeof result === 'string' ? result : inspect(result, { depth: 1 })

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Eval Result')
        .setDescription(
          `Executed in ${execTimeMs}ms\n\n**Input:**\n\`\`\`ts\n${code.length > 4069 ? code.substring(0, 4000) + '...' : code}\n\`\`\``
        )

      if (formattedResult.length <= 4069) {
        embed.setDescription(
          embed.data.description +
            `\n\n**Output:**\n\`\`\`js\n${formattedResult}\n\`\`\``
        )
        return message.reply({ embeds: [embed] })
      } else {
        await message.reply({ embeds: [embed] })

        let remainingOutput = formattedResult
        let chunkNum = 1

        while (remainingOutput.length > 0) {
          const chunk = remainingOutput.substring(0, 4069)
          remainingOutput = remainingOutput.substring(4069)

          const continueEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`Eval Result (Output ${chunkNum})`)
            .setDescription(`\`\`\`js\n${chunk}\n\`\`\``)

          await message.channel.send({ embeds: [continueEmbed] })
          chunkNum++
        }

        return
      }
    } catch (error: any) {
      const fullError = inspect(error, { depth: 3 })
      const errorStack = error.stack || ''

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Eval Error')
        .setDescription(
          `**Input:**\n\`\`\`ts\n${code.length > 4069 ? code.substring(0, 4000) + '...' : code}\n\`\`\``
        )

      if (fullError.length + errorStack.length <= 4069) {
        errorEmbed.setDescription(
          errorEmbed.data.description +
            `\n\n**Error Details:**\n\`\`\`js\n${fullError}\n\`\`\`\n\n**Stack Trace:**\n\`\`\`js\n${errorStack}\n\`\`\``
        )
        return message.reply({ embeds: [errorEmbed] })
      } else {
        await message.reply({ embeds: [errorEmbed] })

        if (fullError.length > 0) {
          const errorDetailsEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error Details')
            .setDescription(`\`\`\`js\n${fullError.substring(0, 4069)}\n\`\`\``)

          await message.channel.send({ embeds: [errorDetailsEmbed] })

          let remainingError = fullError.substring(4069)
          let chunkNum = 1

          while (remainingError.length > 0) {
            const chunk = remainingError.substring(0, 4069)
            remainingError = remainingError.substring(4069)

            const continueEmbed = new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle(`Error Details (continued ${chunkNum})`)
              .setDescription(`\`\`\`js\n${chunk}\n\`\`\``)

            await message.channel.send({ embeds: [continueEmbed] })
            chunkNum++
          }
        }

        // Send stack trace in chunks
        if (errorStack.length > 0) {
          const stackTraceEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Stack Trace')
            .setDescription(
              `\`\`\`js\n${errorStack.substring(0, 4069)}\n\`\`\``
            )

          await message.channel.send({ embeds: [stackTraceEmbed] })

          let remainingStack = errorStack.substring(4069)
          let chunkNum = 1

          while (remainingStack.length > 0) {
            const chunk = remainingStack.substring(0, 4069)
            remainingStack = remainingStack.substring(4069)

            const continueEmbed = new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle(`Stack Trace (continued ${chunkNum})`)
              .setDescription(`\`\`\`js\n${chunk}\n\`\`\``)

            await message.channel.send({ embeds: [continueEmbed] })
            chunkNum++
          }
        }

        return
      }
    }
  },
})
