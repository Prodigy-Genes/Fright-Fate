import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  gameSessions: defineTable({
    sessionCode: v.string(),
    hostId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("completed")),
    currentScene: v.number(),
    theme: v.string(),
    createdAt: v.number(),
  }).index("by_session_code", ["sessionCode"]),

  players: defineTable({
    sessionId: v.id("gameSessions"),
    userId: v.id("users"),
    name: v.string(),
    joinedAt: v.number(),
    isReady: v.boolean(),
  }).index("by_session", ["sessionId"]),

  answers: defineTable({
    sessionId: v.id("gameSessions"),
    playerId: v.id("players"),
    sceneNumber: v.number(),
    answer: v.string(),
    submittedAt: v.number(),
  }).index("by_session_and_scene", ["sessionId", "sceneNumber"])
   .index("by_player", ["playerId"]),

  gameResults: defineTable({
    sessionId: v.id("gameSessions"),
    rankings: v.array(v.object({
      playerId: v.id("players"),
      playerName: v.string(),
      rank: v.number(),
      survivalScore: v.number(),
      commentary: v.string(),
      deathScene: v.optional(v.string()),
    })),
    narrative: v.string(),
    completedAt: v.number(),
  }).index("by_session", ["sessionId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
