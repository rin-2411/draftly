import type { OutputLength, Tone } from "@/lib/types";

export type BuiltinStoryTemplate = {
  id: string;
  name: string;
  description: string;
  title: string;
  content: string;
  tone: Tone;
  length: OutputLength;
};

export const BUILTIN_STORY_TEMPLATES: BuiltinStoryTemplate[] = [
  {
    id: "wire-brief",
    name: "Wire brief (inverted pyramid)",
    description:
      "Short news format: lead with the news, then supporting facts and context. Good for breaking updates.",
    title: "[Headline — present tense, max ~10 words]",
    tone: "formal",
    length: "short",
    content: `[LEDE — who, what, when, where in 1–2 sentences]

[KEY FACT 2 — most important next detail]

[KEY FACT 3]

[CONTEXT — background only if needed]

[QUOTE or attribution — Name, Title, Organization said “…”]

[WHAT HAPPENS NEXT — if known]

— End —
`,
  },
  {
    id: "news-feature",
    name: "News feature",
    description:
      "Scene-led or human-led story with nut graf, body sections, and a strong close. Medium length.",
    title: "[Feature headline — can be more literary than a wire]",
    tone: "formal",
    length: "medium",
    content: `[OPENING SCENE or ANECDOTE — draw the reader in]

[NUT GRAF — why this story matters now; the “so what” in 2–4 sentences]

[SECTION 1 — main thread]

[SECTION 2 — complication or second angle]

[SECTION 3 — voices: paraphrase and short quotes]

[SECTION 4 — what’s at stake / data / expert view]

[KICKER — image, quote, or forward look]

— Notes: [What still needs reporting?]
`,
  },
  {
    id: "opinion-column",
    name: "Opinion / column",
    description:
      "Clear thesis, evidence, counterargument, and conclusion. Opinionated tone with transparent reasoning.",
    title: "[Column headline — argues a position]",
    tone: "opinionated",
    length: "medium",
    content: `[THESIS — what you believe and why readers should care, in 1 short paragraph]

[REASON 1 + evidence / example]

[REASON 2 + evidence / example]

[ACKNOWLEDGE strongest counterargument — then rebut fairly]

[IMPLICATION — what should change, or what readers should do]

[CLOSING LINE — memorable, not a repeat of the thesis]

— Disclosure / conflicts: [if any]
`,
  },
  {
    id: "qa-interview",
    name: "Q&A interview",
    description:
      "Structured questions and answers. Works for profiles, explainers, and expert walkthroughs.",
    title: "[Interview subject — role / why they matter]",
    tone: "formal",
    length: "medium",
    content: `Intro: [2–3 sentences on who this is and why you spoke to them.]

Q: [Question 1 — clear and specific]
A: [Answer — can be edited for length/clarity with note: “edited for clarity” if needed]

Q: [Question 2]
A:

Q: [Question 3]
A:

Q: [Question 4 — forward-looking or personal]
A:

— Fact-check: [claims to verify]
`,
  },
  {
    id: "explainer",
    name: "Explainer (how / why)",
    description:
      "Define the topic, walk through mechanics or history, and answer common reader questions. Longer form.",
    title: "[Explainer headline — “What is…?” or “Why does…?”]",
    tone: "formal",
    length: "long",
    content: `[ONE-SENTENCE DEFINITION]

[WHY READERS CARE RIGHT NOW]

[SECTION — How it works (step-by-step or concept-by-concept)]

[SECTION — Key terms (short glosses)]

[SECTION — Common misconceptions vs reality]

[SECTION — What happens next / open questions]

[FAQ — 3–5 short Q&As]

[Sources / further reading — list URLs or titles to verify]
`,
  },
  {
    id: "live-blog",
    name: "Live blog / rolling updates",
    description:
      "Timestamped short entries for developing stories. Casual, scannable blocks.",
    title: "LIVE: [Event name]",
    tone: "casual",
    length: "short",
    content: `[HH:MM] — [Latest development in 1–3 sentences.]

[HH:MM] — [Update]

[HH:MM] — [Context / official statement summary]

[HH:MM] — [What we’re watching next]

— Editors: [pin important correction or key link here]
`,
  },
];

const byId = new Map(BUILTIN_STORY_TEMPLATES.map((t) => [t.id, t]));

export function getBuiltinTemplateById(id: string): BuiltinStoryTemplate | undefined {
  if (!id || typeof id !== "string") return undefined;
  const normalized = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return byId.get(normalized);
}
