import { callGiorgioScriptEndpoint } from "../integrations/fastapiClients";
import { saveRunHistory } from "../memory/memoryClient";

export interface SkySkyEpisodeInput {
  lesson: string; // e.g. "sharing", "telling the truth", "handling big feelings"
  ageRange?: string; // e.g. "3-5"
  theme?: string; // e.g. "bedtime", "friendship", "family"
}

export type SkySkyEpisodeStage =
  | "intro" // SkySky talking directly to the viewers
  | "problem" // the issue shows up but is not resolved
  | "reflection" // bedtime/podcast-style reflection
  | "imagination_world" // travel to imaginary sky world, meets a character
  | "song" // short song that processes the lesson
  | "resolution"; // SkySky comes back and resolves the issue with new values

export interface SkySkyEpisodeBeat {
  id: string;
  name: string;
  stage: SkySkyEpisodeStage;
  owner: "marcus" | "giorgio" | "letitia" | "jamal" | "system";
  description: string; // structural description ONLY, not full script
}

export interface SkySkyEpisodePlan {
  input: SkySkyEpisodeInput;
  beats: SkySkyEpisodeBeat[];
}

export interface SkySkyEpisodeScriptResult {
  plan: SkySkyEpisodePlan;
  script: string;
}

const DEFAULT_BEATS: Omit<SkySkyEpisodeBeat, "id">[] = [
  {
    name: "Direct intro",
    stage: "intro",
    owner: "marcus",
    description: "SkySky greets viewers and frames the day's lesson.",
  },
  {
    name: "The problem",
    stage: "problem",
    owner: "marcus",
    description: "SkySky or a friend faces a challenge tied to the lesson.",
  },
  {
    name: "Reflection",
    stage: "reflection",
    owner: "marcus",
    description: "Quiet moment (bedtime/podcast style) where feelings are named.",
  },
  {
    name: "Imagination world",
    stage: "imagination_world",
    owner: "giorgio",
    description: "Travel to a cloud world and meet a guide character.",
  },
  {
    name: "Lesson song",
    stage: "song",
    owner: "giorgio",
    description: "Short song that processes the core lesson.",
  },
  {
    name: "Resolution",
    stage: "resolution",
    owner: "marcus",
    description: "Return home, apply the new value, and close the loop.",
  },
];

let beatCounter = 0;
function nextBeatId() {
  beatCounter += 1;
  return `beat_${beatCounter}`;
}

export async function planSkySkyEpisode(input: SkySkyEpisodeInput): Promise<SkySkyEpisodePlan> {
  const beats: SkySkyEpisodeBeat[] = DEFAULT_BEATS.map((beat) => ({
    ...beat,
    id: nextBeatId(),
    description: `${beat.description} Lesson: ${input.lesson}${input.theme ? `, Theme: ${input.theme}` : ""}.`,
  }));

  return {
    input,
    beats,
  };
}

export async function generateSkySkyEpisodeScript(
  input: SkySkyEpisodeInput,
): Promise<SkySkyEpisodeScriptResult> {
  try {
    const plan = await planSkySkyEpisode(input);

    const briefLines = plan.beats.map(
      (beat, idx) =>
        `${idx + 1}. [${beat.stage}] ${beat.name} — Owner: ${beat.owner}. ${beat.description}`,
    );

    const brief = [
      `SkySky Lesson: ${input.lesson}`,
      input.theme ? `Theme: ${input.theme}` : undefined,
      input.ageRange ? `Audience: ages ${input.ageRange}` : undefined,
      "",
      "Beats:",
      ...briefLines,
    ]
      .filter(Boolean)
      .join("\n");

    let script: string;
    try {
      const scriptResponse = await callGiorgioScriptEndpoint({
        brief,
        format: "script",
        character: "SkySky",
      });

      const extracted =
        typeof scriptResponse === "string"
          ? scriptResponse
          : typeof (scriptResponse as any)?.script === "string"
          ? (scriptResponse as any).script
          : typeof (scriptResponse as any)?.data?.script === "string"
          ? (scriptResponse as any).data.script
          : typeof (scriptResponse as any)?.data === "string"
          ? (scriptResponse as any).data
          : typeof (scriptResponse as any)?.message === "string"
          ? (scriptResponse as any).message
          : null;

      if (!extracted) {
        throw new Error("Giorgio response missing script text");
      }
      script = extracted;
    } catch (err) {
      const placeholder = plan.beats
        .map((beat, idx) => `${idx + 1}. [${beat.stage}] ${beat.description}`)
        .join("\n");
      script = `Giorgio FastAPI unavailable (fallback). Reason: ${(err as Error).message}\n${placeholder}`;
    }

    const result: SkySkyEpisodeScriptResult = { plan, script };
    await saveRunHistory({
      workflow: "skySkyEpisode",
      project: "SkySky",
      input,
      output: result,
      status: "success",
    });
    return result;
  } catch (err) {
    await saveRunHistory({
      workflow: "skySkyEpisode",
      project: "SkySky",
      input,
      output: null,
      status: "error",
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
