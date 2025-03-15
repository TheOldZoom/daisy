import { Message, TextChannel } from 'discord.js'
import Command from '../../struct/Command'
import { inspect } from 'util'

export default new Command({
  name: 'eval',
  description: 'Evaluates TypeScript code. Developer only.',
  aliases: ['ev', 'evaluate'],
  devOnly: true,
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('Please provide code to evaluate.')
    }

    if (!(message.channel instanceof TextChannel)) {
      return message.reply('This command can only be used in a text channel.')
    }

    const code = args.join(' ')

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

      const formattedResult =
        typeof result === 'string' ? result : inspect(result, { depth: 0 })

      const response =
        formattedResult.length > 1900
          ? `${formattedResult.substring(0, 1900)}...`
          : formattedResult

      return message.reply(`\`\`\`js\n${response}\n\`\`\``)
    } catch (error: any) {
      return message.reply(`Error: \`\`\`js\n${error.message}\n\`\`\``)
    }
  },
})
