import Client from "../../struct/Client";
import divider from "../../utils/helpers/divider";

export default (client: Client) => {
  divider();

  client.logs.info(`Logged in as ${client.user?.tag}`);
};
