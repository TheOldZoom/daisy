import { User } from "discord.js";
import Client from "../struct/Client";

export default async (id: string, client: Client) => {
    let user = client.users.cache.get(id);

    if (!user) {
        try {
            user = await client.users.fetch(id);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            return null;
        }
    }

    return user as User
};
