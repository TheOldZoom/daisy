import { User } from "discord.js";
import userByCacheOrFetch from "./userByCacheOrFetch";
import Client from "../struct/Client";

interface GetTargetUserOptions {
  allowBots?: boolean;
}

interface TargetUserSuccessResponse {
  success: true;
  user: User;
}

interface TargetUserErrorResponse {
  success: false;
  error: string;
}

type TargetUserResponse = TargetUserSuccessResponse | TargetUserErrorResponse;

export async function getTargetUser(
  id: string | null,
  client: Client,
  options: GetTargetUserOptions = {}
): Promise<TargetUserResponse> {
  const { allowBots = true } = options;

  if (!id) {
    return {
      success: false,
      error: "No user ID was provided",
    };
  }

  const user = await userByCacheOrFetch(id, client);

  if (!user) {
    return {
      success: false,
      error: "User not found",
    };
  }

  if (!allowBots && user.bot) {
    return {
      success: false,
      error: "This command cannot be used with bot users",
    };
  }

  return {
    success: true,
    user,
  };
}
