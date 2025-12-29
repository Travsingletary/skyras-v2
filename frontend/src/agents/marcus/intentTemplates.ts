/**
 * Intent Templates for Phase 1 Validation
 * All templates are single-field actions only - no multi-slot formats, no examples
 */

export const INTENT_TEMPLATES = {
  /**
   * Default template (with constraint)
   */
  default: "Write the exact name of the deliverable you need next (max 5 words).",
  
  /**
   * General task extraction
   */
  lastTask: "Write the last task you worked on.",
  
  /**
   * Task naming (pure output format)
   */
  taskName: "Write one task name as 'verb object'.",
  
  /**
   * Narrow intent templates (single-field only)
   */
  contentCalendar: "Write the platform you're planning content for.",
  creativeDirections: "Write one sentence describing the direction you want to explore.",
  ideaButDontKnowHowToStart: "Write the core idea in one sentence.",
} as const;

export type IntentTemplateKey = keyof typeof INTENT_TEMPLATES;

/**
 * Get template by key
 */
export function getIntentTemplate(key: IntentTemplateKey): string {
  return INTENT_TEMPLATES[key];
}

/**
 * Check if a template exists
 */
export function hasIntentTemplate(key: string): key is IntentTemplateKey {
  return key in INTENT_TEMPLATES;
}

/**
 * Intent keyword patterns for template routing
 */
export const INTENT_KEYWORDS = {
  contentCalendar: /(content calendar|content plan|posting plan|content strategy|schedule|plan.*content|calendar)/i,
  creativeDirections: /(direction|directions|vibe|tone|style|concept|creative|explore.*direction|new.*direction|creative.*direction)/i,
  ideaButDontKnowHowToStart: /(where do I start|how do I start|starting point|don't know how to start|don't know where to start|idea but|have an idea but)/i,
} as const;

/**
 * Detect intent from user prompt
 */
export function detectIntent(prompt: string): IntentTemplateKey | null {
  // Check narrow intents first
  if (INTENT_KEYWORDS.contentCalendar.test(prompt)) {
    return 'contentCalendar';
  }
  if (INTENT_KEYWORDS.creativeDirections.test(prompt)) {
    return 'creativeDirections';
  }
  if (INTENT_KEYWORDS.ideaButDontKnowHowToStart.test(prompt)) {
    return 'ideaButDontKnowHowToStart';
  }
  
  // Default to null (will use default template)
  return null;
}
