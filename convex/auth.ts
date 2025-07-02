// convex/auth.ts
import { query } from "./_generated/server";
import { auth } from "./auth.config";

export const loggedInUser = query({
  args: {},
  handler: async (ctx) => {
    return await auth.getUserId(ctx);
  },
});