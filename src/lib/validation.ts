import { z } from "zod";
import { OUTPUT_LANGUAGE_CODES } from "@/lib/output-languages";

const urlSchema = z
  .string()
  .trim()
  .url("Invalid URL")
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "URL must start with http:// or https://",
  });

const outputLanguageSchema = z.enum(OUTPUT_LANGUAGE_CODES);

export const generateRequestSchema = z.object({
  urls: z.array(urlSchema).min(1).max(5),
  tone: z.enum(["formal", "casual", "opinionated"]),
  length: z.enum(["short", "medium", "long"]),
  language: outputLanguageSchema.default("auto"),
});

export const draftUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().min(1),
});

/** Manual save / new draft from editor (no AI generation) */
export const draftCreateSchema = z.object({
  title: z.string().trim().max(160).optional(),
  content: z.string().min(1, "Add some content before saving."),
  source_urls: z.array(z.string().trim()).max(5).optional().default([]),
  tone: z.enum(["formal", "casual", "opinionated"]).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
});

const tagSchema = z.string().trim().min(1).max(48);

export const researchSourceCreateSchema = z.object({
  url: urlSchema,
  title: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(8000).optional().nullable(),
  tags: z.array(tagSchema).max(24).optional().default([]),
});

export const researchSourceUpdateSchema = z.object({
  url: urlSchema.optional(),
  title: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(8000).optional().nullable(),
  tags: z.array(tagSchema).max(24).optional(),
});

export const userPreferencesPatchSchema = z
  .object({
    tone: z.enum(["formal", "casual", "opinionated"]).optional(),
    length: z.enum(["short", "medium", "long"]).optional(),
    language: outputLanguageSchema.optional(),
    display_name: z.union([z.string().trim().max(120), z.literal("")]).optional(),
  })
  .refine(
    (data) =>
      data.tone !== undefined ||
      data.length !== undefined ||
      data.language !== undefined ||
      data.display_name !== undefined,
    { message: "Provide at least one field to update." }
  );

export const adminUserPatchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  is_disabled: z.boolean().optional(),
});

export const adminSettingsPatchSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().trim().max(500).optional(),
  announcement: z.string().trim().max(500).optional(),
  daily_generate_limit: z.number().int().min(1).max(500).optional(),
});
