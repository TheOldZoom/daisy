import Command from "../../struct/Command";

export default new Command({
  name: "ping",
  description: "Pong!",
  execute: async (message, args, client) => {
    message.reply("Pong!");
  },
});
