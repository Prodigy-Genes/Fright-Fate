import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Horror scenarios by theme
const HORROR_SCENARIOS = {
  "haunted-house": [
    {
      title: "The Creaking Door",
      scene: "You're exploring an abandoned Victorian mansion when you hear a door slowly creaking open upstairs. The sound echoes through the empty halls, and you notice the temperature has dropped significantly.",
      question: "What do you do next?"
    },
    {
      title: "The Basement Discovery",
      scene: "While searching for an exit, you find a basement door that's slightly ajar. Strange scratching sounds are coming from below, and there's a foul smell wafting up from the darkness.",
      question: "How do you handle this situation?"
    },
    {
      title: "The Mirror's Reflection",
      scene: "In the master bedroom, you notice an ornate mirror that shows your reflection... but there's something else moving behind you in the reflection that isn't there when you turn around.",
      question: "What's your next move?"
    },
    {
      title: "The Locked Room",
      scene: "You've found what appears to be the only exit, but it's locked from the inside. As you examine the lock, you hear footsteps approaching from the hallway behind you, getting closer and closer.",
      question: "Describe your escape plan."
    },
    {
      title: "The Attic Whispers",
      scene: "Desperate to find another way out, you climb into the dusty attic. You hear whispers coming from the shadows, speaking your name in voices you don't recognize.",
      question: "How do you respond to this supernatural encounter?"
    },
    {
      title: "The Séance Room",
      scene: "You discover a room with a Ouija board still set up on the table, candles recently blown out. The planchette begins moving on its own, spelling out 'GET OUT' repeatedly.",
      question: "What do you do with this warning?"
    },
    {
      title: "The Phantom Piano",
      scene: "A piano in the parlor starts playing a haunting melody by itself. The music seems to be drawing you closer, and you feel an overwhelming urge to sit down and play along.",
      question: "How do you resist or respond to this supernatural compulsion?"
    },
    {
      title: "The Bleeding Walls",
      scene: "The wallpaper in the dining room begins to bleed, with dark red stains spreading across the walls. The blood seems to be forming words: 'JOIN US'.",
      question: "What's your reaction to this terrifying display?"
    },
    {
      title: "The Final Confrontation",
      scene: "You've reached what you think is the exit, but a ghostly figure materializes in front of the door. It speaks: 'You cannot leave until you understand why we're trapped here.'",
      question: "How do you handle this final supernatural encounter?"
    },
    {
      title: "The Choice",
      scene: "The ghost offers you a deal: stay and become one of them forever, or solve the mystery of their death to free everyone. You have only minutes before dawn, when the choice will be made for you.",
      question: "What is your final decision and how do you execute it?"
    }
  ],
  "zombie-outbreak": [
    {
      title: "The First Bite",
      scene: "You're at work when news breaks of a 'rabies outbreak' in the city center. Through your office window, you see people running and screaming in the streets below. Your coworker next to you suddenly collapses, convulsing.",
      question: "What's your immediate response?"
    },
    {
      title: "The Evacuation",
      scene: "Emergency broadcasts are telling everyone to evacuate immediately. You're in your car, but traffic is completely gridlocked. You see infected people attacking other drivers just ahead of you.",
      question: "How do you get out of this traffic jam alive?"
    },
    {
      title: "The Safe House",
      scene: "You've made it to what seems like a secure building with other survivors. Someone is banging on the door, claiming to be uninfected and begging to be let in. But you notice they have a fresh bite mark on their arm.",
      question: "Do you let them in? What's your reasoning?"
    },
    {
      title: "The Supply Run",
      scene: "Food and water are running low. The nearest store is three blocks away through zombie-infested streets. You can go alone and move quietly, or take others but risk making more noise.",
      question: "Describe your supply run strategy."
    },
    {
      title: "The Infected Friend",
      scene: "Your best friend got bitten during the supply run but is hiding it from the group. You caught them trying to treat the wound in secret. They beg you not to tell anyone.",
      question: "How do you handle this moral dilemma?"
    },
    {
      title: "The Military Checkpoint",
      scene: "You hear on the radio that the military is evacuating survivors from a checkpoint 10 miles away. But getting there means crossing the most dangerous part of the city, and you're not sure if the checkpoint is still operational.",
      question: "Do you risk the journey? What's your travel plan?"
    },
    {
      title: "The Betrayal",
      scene: "Another survivor in your group suggests leaving the elderly and injured behind because they're 'slowing everyone down.' Some people are starting to agree with them.",
      question: "How do you respond to this proposal?"
    },
    {
      title: "The Horde",
      scene: "A massive horde of zombies has surrounded your building. You have enough supplies for maybe two more days. There's a sewer entrance in the basement, but you don't know where it leads.",
      question: "What's your escape plan?"
    },
    {
      title: "The Cure",
      scene: "You encounter a scientist who claims to have developed a cure, but it's untested. They want to use it on your infected friend. The scientist admits there's a 50% chance it could kill them instead of curing them.",
      question: "Do you allow the experimental treatment? Why or why not?"
    },
    {
      title: "The Final Stand",
      scene: "You've reached the evacuation point, but it's overrun. There's one helicopter left, but it can only take half your group. The pilot is getting ready to leave with or without you.",
      question: "Who goes on the helicopter and how do you make that decision?"
    }
  ]
};

// Generate unique session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const createGameSession = mutation({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const sessionCode = generateSessionCode();
    
    const sessionId = await ctx.db.insert("gameSessions", {
      sessionCode,
      hostId: userId,
      status: "waiting",
      currentScene: 0,
      theme: args.theme,
      createdAt: Date.now(),
    });

    // Add host as first player
    const user = await ctx.db.get(userId);
    await ctx.db.insert("players", {
      sessionId,
      userId,
      name: user?.name || user?.email || "Host",
      joinedAt: Date.now(),
      isReady: false,
    });

    return { sessionId, sessionCode };
  },
});

export const createSoloSession = mutation({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const sessionCode = generateSessionCode();
    
    const sessionId = await ctx.db.insert("gameSessions", {
      sessionCode,
      hostId: userId,
      status: "active", // Start immediately for solo play
      currentScene: 0,
      theme: args.theme,
      createdAt: Date.now(),
    });

    // Add user as solo player
    const user = await ctx.db.get(userId);
    await ctx.db.insert("players", {
      sessionId,
      userId,
      name: user?.name || user?.email || "Solo Player",
      joinedAt: Date.now(),
      isReady: true, // Always ready in solo mode
    });

    return { sessionId, sessionCode };
  },
});

export const joinGameSession = mutation({
  args: { sessionCode: v.string(), playerName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_code", (q) => q.eq("sessionCode", args.sessionCode))
      .unique();

    if (!session) throw new Error("Session not found");
    if (session.status !== "waiting") throw new Error("Session already started");

    // Check if user already joined
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (existingPlayer) {
      return { sessionId: session._id, playerId: existingPlayer._id };
    }

    const playerId = await ctx.db.insert("players", {
      sessionId: session._id,
      userId,
      name: args.playerName,
      joinedAt: Date.now(),
      isReady: false,
    });

    return { sessionId: session._id, playerId };
  },
});

export const getGameSession = query({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const scenarios = HORROR_SCENARIOS[session.theme as keyof typeof HORROR_SCENARIOS] || HORROR_SCENARIOS["haunted-house"];
    const currentScenario = session.currentScene < scenarios.length ? scenarios[session.currentScene] : null;

    return {
      ...session,
      players,
      currentScenario,
      totalScenes: scenarios.length,
    };
  },
});

export const togglePlayerReady = mutation({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const player = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (!player) throw new Error("Player not found");

    await ctx.db.patch(player._id, { isReady: !player.isReady });
  },
});

export const startGame = mutation({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.hostId !== userId) throw new Error("Only host can start game");

    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const allReady = players.every(p => p.isReady);
    if (!allReady) throw new Error("All players must be ready");

    await ctx.db.patch(args.sessionId, { status: "active" });
  },
});

export const submitAnswer = mutation({
  args: { 
    sessionId: v.id("gameSessions"), 
    answer: v.string() 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") throw new Error("Game not active");

    const player = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (!player) throw new Error("Player not found");

    // Check if answer already exists for this scene
    const existingAnswer = await ctx.db
      .query("answers")
      .withIndex("by_session_and_scene", (q) => 
        q.eq("sessionId", args.sessionId).eq("sceneNumber", session.currentScene)
      )
      .filter((q) => q.eq(q.field("playerId"), player._id))
      .unique();

    if (existingAnswer) {
      await ctx.db.patch(existingAnswer._id, { 
        answer: args.answer,
        submittedAt: Date.now()
      });
    } else {
      await ctx.db.insert("answers", {
        sessionId: args.sessionId,
        playerId: player._id,
        sceneNumber: session.currentScene,
        answer: args.answer,
        submittedAt: Date.now(),
      });
    }

    // Check if all players have answered
    const allAnswers = await ctx.db
      .query("answers")
      .withIndex("by_session_and_scene", (q) => 
        q.eq("sessionId", args.sessionId).eq("sceneNumber", session.currentScene)
      )
      .collect();

    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (allAnswers.length === players.length) {
      // All players answered, advance to next scene or finish game
      const scenarios = HORROR_SCENARIOS[session.theme as keyof typeof HORROR_SCENARIOS] || HORROR_SCENARIOS["haunted-house"];
      
      if (session.currentScene + 1 >= scenarios.length) {
        // Game complete, generate results
        await ctx.db.patch(args.sessionId, { status: "completed" });
        await ctx.scheduler.runAfter(0, internal.game.generateGameResults, {
          sessionId: args.sessionId
        });
      } else {
        // Advance to next scene
        await ctx.db.patch(args.sessionId, { 
          currentScene: session.currentScene + 1 
        });
      }
    }
  },
});

export const getPlayerAnswers = query({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be authenticated");

    const player = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (!player) return [];

    return await ctx.db
      .query("answers")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .collect();
  },
});

export const getGameResults = query({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameResults")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});

export const generateGameResults = internalAction({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.game.getGameSession, { sessionId: args.sessionId });
    if (!session) throw new Error("Session not found");

    const players = session.players;
    const allAnswers = await ctx.runQuery(internal.game.getAllAnswers, { sessionId: args.sessionId });

    // Group answers by player
    const playerAnswers: Record<string, any[]> = {};
    for (const answer of allAnswers) {
      if (!playerAnswers[answer.playerId]) {
        playerAnswers[answer.playerId] = [];
      }
      playerAnswers[answer.playerId].push(answer);
    }

    // Analyze each player's survival chances using AI
    const rankings = [];
    
    for (const player of players) {
      const answers = playerAnswers[player._id] || [];
      const answerText = answers
        .sort((a, b) => a.sceneNumber - b.sceneNumber)
        .map(a => `Scene ${a.sceneNumber + 1}: ${a.answer}`)
        .join('\n\n');

      const analysis = await ctx.runAction(internal.game.analyzePlayerSurvival, {
        playerName: player.name,
        answers: answerText,
        theme: session.theme
      });

      rankings.push({
        playerId: player._id,
        playerName: player.name,
        rank: analysis.rank,
        survivalScore: analysis.score,
        commentary: analysis.commentary,
        deathScene: analysis.deathScene,
      });
    }

    // Sort by survival score (higher is better)
    rankings.sort((a, b) => b.survivalScore - a.survivalScore);
    
    // Assign final ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    // Generate overall narrative
    const narrative = await ctx.runAction(internal.game.generateGameNarrative, {
      theme: session.theme,
      rankings: rankings.map(r => ({
        name: r.playerName,
        rank: r.rank,
        commentary: r.commentary
      }))
    });

    await ctx.runMutation(internal.game.saveGameResults, {
      sessionId: args.sessionId,
      rankings,
      narrative
    });
  },
});

export const getAllAnswers = internalQuery({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("answers")
      .withIndex("by_session_and_scene", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

export const analyzePlayerSurvival = internalAction({
  args: { 
    playerName: v.string(),
    answers: v.string(),
    theme: v.string()
  },
  handler: async (ctx, args) => {
    const prompt = `You are analyzing a player's survival chances in a horror scenario. 

Theme: ${args.theme}
Player: ${args.playerName}

Their answers to survival scenarios:
${args.answers}

Based on their responses, provide a JSON analysis with:
1. score (0-100, where 100 is most likely to survive)
2. rank (1-10 estimate, will be adjusted later)
3. commentary (2-3 sentences explaining their survival chances in a fun, horror-movie style. Be encouraging for solo players while still being dramatic)
4. deathScene (optional, if score is below 60, describe a potential demise in 1 sentence)

Consider factors like:
- Logical thinking vs panic
- Selfishness vs helping others
- Risk-taking vs caution
- Preparation and planning
- Horror movie trope awareness
- Creative problem-solving

For solo players, focus on their individual strengths and areas for improvement.

Respond with valid JSON only.`;

    try {
      const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      return {
        score: Math.max(0, Math.min(100, analysis.score)),
        rank: analysis.rank,
        commentary: analysis.commentary,
        deathScene: analysis.deathScene,
      };
    } catch (error) {
      // Fallback scoring if AI fails
      const answerLength = args.answers.length;
      const score = Math.min(100, Math.max(10, answerLength / 10));
      
      return {
        score,
        rank: 5,
        commentary: `${args.playerName} shows average survival instincts. Their responses suggest they might make it through some challenges but could struggle with the more intense scenarios.`,
        deathScene: undefined,
      };
    }
  },
});

export const generateGameNarrative = internalAction({
  args: { 
    theme: v.string(),
    rankings: v.array(v.object({
      name: v.string(),
      rank: v.number(),
      commentary: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const prompt = `Create a dramatic horror movie-style narrative summary for a survival game.

Theme: ${args.theme}
Player Rankings (1 = survivor, higher = dies earlier):
${args.rankings.map(r => `${r.rank}. ${r.name}: ${r.commentary}`).join('\n')}

${args.rankings.length === 1 
  ? `Write a 2-3 paragraph analysis of this solo player's journey through the horror scenario. Focus on their decision-making process, survival instincts, and what their choices reveal about their character. Make it dramatic but encouraging, like a personalized horror survival assessment.`
  : `Write a 3-4 paragraph cinematic summary of how this horror scenario played out, mentioning each player and their fate. Make it entertaining and dramatic, like a movie synopsis. Use horror movie language and tropes.`
}`;

    try {
      const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      return `In this terrifying ${args.theme} scenario, our survivors faced unimaginable horrors. ${args.rankings[0]?.name} emerged as the sole survivor, while others weren't so fortunate. The nightmare claimed its victims one by one, each meeting their fate in increasingly dramatic fashion.`;
    }
  },
});

export const saveGameResults = internalMutation({
  args: {
    sessionId: v.id("gameSessions"),
    rankings: v.array(v.object({
      playerId: v.id("players"),
      playerName: v.string(),
      rank: v.number(),
      survivalScore: v.number(),
      commentary: v.string(),
      deathScene: v.optional(v.string()),
    })),
    narrative: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("gameResults", {
      sessionId: args.sessionId,
      rankings: args.rankings,
      narrative: args.narrative,
      completedAt: Date.now(),
    });
  },
});
