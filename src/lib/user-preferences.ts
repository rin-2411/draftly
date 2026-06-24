import { isOutputLanguage, type OutputLanguage } from "@/lib/output-languages";
import type { OutputLength, Tone } from "@/lib/types";

const TONES: Tone[] = ["formal", "casual", "opinionated"];
const LENGTHS: OutputLength[] = ["short", "medium", "long"];

function isTone(v: unknown): v is Tone {
  return typeof v === "string" && TONES.includes(v as Tone);
}

function isLength(v: unknown): v is OutputLength {
  return typeof v === "string" && LENGTHS.includes(v as OutputLength);
}

/** Defaults used for new drafts when no draft/template overrides apply. */
export function getWorkspaceDefaultsFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): { tone: Tone; length: OutputLength; language: OutputLanguage } {
  const tone = metadata?.default_tone;
  const length = metadata?.default_length;
  const language = metadata?.default_language;
  return {
    tone: isTone(tone) ? tone : "formal",
    length: isLength(length) ? length : "medium",
    language: isOutputLanguage(language) ? language : "auto",
  };
}

export function getDisplayNameFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata) return null;
  const dn = metadata.display_name;
  if (typeof dn === "string" && dn.trim()) return dn.trim();
  const fn = metadata.full_name;
  if (typeof fn === "string" && fn.trim()) return fn.trim();
  return null;
}
