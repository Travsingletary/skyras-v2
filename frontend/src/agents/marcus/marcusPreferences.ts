/**
 * Marcus Preferences - Trav-specific configuration
 *
 * This module defines how Marcus should interact with Trav based on
 * his communication style, work patterns, and project priorities.
 */

export interface MarcusPreferences {
  /** User identifier */
  userId: string;

  /** Communication tone and style */
  tone: {
    style: string;
    characteristics: string[];
  };

  /** Task management preferences */
  taskStyle: {
    maxTasksPerResponse: number;
    priorityFormat: string;
    approach: string;
  };

  /** Focus and accountability needs */
  focusNeeds: {
    callOutDistraction: boolean;
    whyBeforeWhat: boolean;
    actionOriented: boolean;
  };

  /** Active projects and their priority */
  projects: {
    name: string;
    description: string;
    priority: "high" | "medium" | "low";
  }[];

  /** Long-term vision context */
  vision: {
    financial: string;
    creative: string;
    legacy: string;
  };
}

/**
 * Get Marcus preferences for the current user
 *
 * TODO: In the future, load from Supabase user_preferences table
 * For now, returns hard-coded Trav preferences
 */
export function getMarcusPreferences(userId?: string): MarcusPreferences {
  // For now, return Trav's preferences
  // Future: Load from Supabase based on userId
  return {
    userId: userId || "trav",

    tone: {
      style: "direct, no-BS, lightly poetic, some humor",
      characteristics: [
        "Talk like a partner who knows the work",
        "Cut corporate speak and generic advice",
        "Use vivid language when it adds clarity",
        "Occasional wit, kept natural",
        "Adjust based on mode: execution (short), creative (exploratory), overwhelmed (calm)"
      ]
    },

    taskStyle: {
      maxTasksPerResponse: 1,
      priorityFormat: "WHY before WHAT",
      approach: "Give ONE immediate next step, not overwhelming lists"
    },

    focusNeeds: {
      callOutDistraction: true,
      whyBeforeWhat: true,
      actionOriented: true
    },

    projects: [
      {
        name: "SteadyStream",
        description: "Financial stability through consistent creator income",
        priority: "high"
      },
      {
        name: "SkyRas Agency",
        description: "The complete brand and creative OS - the platform, workflow system, and agency we're building",
        priority: "high"
      },
      {
        name: "SkySky",
        description: "The animated show - a content project (scripts, episodes, characters, stories). NOT code or technical infrastructure. This is creative content work.",
        priority: "high"
      },
      {
        name: "Music Production",
        description: "Original music creation and releases",
        priority: "medium"
      }
    ],

    vision: {
      financial: "Build sustainable income through SteadyStream",
      creative: "Create a creative OS that serves myself and other creators",
      legacy: "Build systems and content that outlive me, support family"
    }
  };
}

/**
 * Format preferences as context string for AI prompts
 */
export function formatPreferencesContext(prefs: MarcusPreferences): string {
  return `
## CURRENT USER CONTEXT (${prefs.userId})

**Communication Style**: ${prefs.tone.style}

**Task Approach**: ${prefs.taskStyle.approach}
- Max tasks per response: ${prefs.taskStyle.maxTasksPerResponse}
- Always: ${prefs.taskStyle.priorityFormat}

**Active Projects**:
${prefs.projects.map(p => `- **${p.name}** (${p.priority}): ${p.description}`).join('\n')}

**Vision**:
- Financial: ${prefs.vision.financial}
- Creative: ${prefs.vision.creative}
- Legacy: ${prefs.vision.legacy}

**Focus Reminders**:
- Call out distraction/early quitting: ${prefs.focusNeeds.callOutDistraction ? 'YES' : 'NO'}
- WHY before WHAT: ${prefs.focusNeeds.whyBeforeWhat ? 'ALWAYS' : 'OPTIONAL'}
- Action-oriented: ${prefs.focusNeeds.actionOriented ? 'Push toward concrete next steps' : 'Allow exploration'}
`.trim();
}
