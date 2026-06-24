import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getLanguagePromptInstruction } from "@/lib/output-languages";
import type { OutputLanguage } from "@/lib/output-languages";
import { CrawlResult, OutputLength, Tone } from "@/lib/types";

const lengthGuidance: Record<OutputLength, string> = {
  short: "about 300-500 words",
  medium: "about 700-1000 words",
  long: "about 1200-1500 words",
};

export async function synthesizeContent(input: {
  crawled: CrawlResult[];
  tone: Tone;
  length: OutputLength;
  language: OutputLanguage;
}): Promise<string> {
  const successful = input.crawled.filter((item) => item.success && item.content);
  if (successful.length === 0) {
    throw new Error("None of the provided URLs could be crawled.");
  }

  const sourcePayload = successful
    .map((item, index) => `Source ${index + 1} URL: ${item.url}\n${item.content.slice(0, 20000)}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a factual writing assistant for journalists and bloggers.

Rules:
1) Use ONLY facts from provided sources.
2) Do not invent missing details.
3) Remove redundancy between sources.
4) Write in ${input.tone} tone.
5) Target length: ${lengthGuidance[input.length]}.
6) Write the entire output in ${getLanguagePromptInstruction(input.language)}. Do not mix languages unless the sources require quoted material in another language.
7) Return Markdown only.`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: sourcePayload,
    temperature: 0.2,
  });

  return text.trim();
}
