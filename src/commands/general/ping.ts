import Command from "../../struct/Command";

export default new Command({
  name: "ping",
  description: "Ping the bot and get a response.",
  execute: async (message, args, client) => {
    message.reply("Pong!");
  },
  subs: [
    {
      name: "stats",
      description: "Get bot ping stats.",
      execute: async (message, args, client) => {
        const ping = Date.now() - message.createdTimestamp;
        message.reply(`Bot ping is ${ping}ms.`);
      },
    },
  ],
});
