export const OUTPUT_LANGUAGE_CODES = [
  "auto",
  "en",
  "ms",
  "zh",
  "ta",
  "id",
  "th",
  "vi",
  "ar",
  "hi",
  "ja",
  "ko",
  "es",
  "fr",
  "de",
  "pt",
] as const;

export type OutputLanguage = (typeof OUTPUT_LANGUAGE_CODES)[number];

export const OUTPUT_LANGUAGE_OPTIONS: { value: OutputLanguage; label: string }[] = [
  { value: "auto", label: "Auto (match sources)" },
  { value: "en", label: "English" },
  { value: "ms", label: "Bahasa Malaysia" },
  { value: "zh", label: "Chinese" },
  { value: "ta", label: "Tamil" },
  { value: "id", label: "Indonesian" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
];

const LANGUAGE_PROMPT: Record<OutputLanguage, string> = {
  auto:
    "the same language as the majority of the source material (if unclear, use English)",
  en: "English",
  ms: "Bahasa Malaysia (Malay)",
  zh: "Chinese (Simplified or Traditional as appropriate to the sources)",
  ta: "Tamil",
  id: "Indonesian (Bahasa Indonesia)",
  th: "Thai",
  vi: "Vietnamese",
  ar: "Arabic",
  hi: "Hindi",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
};

export function isOutputLanguage(v: unknown): v is OutputLanguage {
  return typeof v === "string" && OUTPUT_LANGUAGE_CODES.includes(v as OutputLanguage);
}

export function getLanguagePromptInstruction(language: OutputLanguage): string {
  return LANGUAGE_PROMPT[language];
}
