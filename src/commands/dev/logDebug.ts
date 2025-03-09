import Command from '../../struct/Command';

export default new Command({
  name: 'logDebug',
  description: 'Set or disable debug mode.',
  execute: async (message, args, client) => {
    client.logs.setDebug(!client.logs.debugOption);
    message.reply(
      `Debug mode has been ${client.logs.debugOption ? 'enabled' : 'disabled'}.`,
    );
  },
  devOnly: true,
});
