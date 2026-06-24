import { NextResponse } from "next/server";
import { createClient } from "@/config/supabase/server";
import { isUserDisabled } from "@/lib/admin/auth";
import { logGeneration } from "@/lib/admin/logs";
import {
  getSystemSettings,
  getUserGenerationCountToday,
} from "@/lib/admin/settings";
import { generateRequestSchema } from "@/lib/validation";
import { crawlUrls } from "@/lib/crawl";
import { synthesizeContent } from "@/lib/llm";
import { createDraft } from "@/lib/drafts";

function createTitle(content: string) {
  const first = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return (first?.replace(/^#+\s*/, "").slice(0, 120) || "Untitled Draft").trim();
}

export async function POST(request: Request) {
  let userId: string | null = null;
  let parsedInput: {
    urls: string[];
    tone: "formal" | "casual" | "opinionated";
    length: "short" | "medium" | "long";
    language: import("@/lib/output-languages").OutputLanguage;
  } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    if (await isUserDisabled(user.id)) {
      return NextResponse.json(
        { error: "Your account has been disabled. Contact support." },
        { status: 403 }
      );
    }

    const settings = await getSystemSettings();
    if (settings.maintenance_mode) {
      return NextResponse.json(
        { error: settings.maintenance_message },
        { status: 503 }
      );
    }

    const todayCount = await getUserGenerationCountToday(user.id);
    if (todayCount >= settings.daily_generate_limit) {
      return NextResponse.json(
        {
          error: `Daily generation limit reached (${settings.daily_generate_limit}). Try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = generateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }
    parsedInput = parsed.data;

    const { urls, tone, length, language } = parsed.data;
    const crawled = await crawlUrls(urls);
    const crawlOk = crawled.filter((c) => c.success).length;
    const crawlFail = crawled.length - crawlOk;

    const generated = await synthesizeContent({ crawled, tone, length, language });
    const draft = await createDraft({
      title: createTitle(generated),
      content: generated,
      sourceUrls: urls,
      tone,
      length,
    });

    await logGeneration({
      userId: user.id,
      sourceUrls: urls,
      tone,
      length,
      language,
      crawlOk,
      crawlFail,
      success: true,
    });

    return NextResponse.json({
      draft,
      crawlResults: crawled.map((entry) => ({
        url: entry.url,
        success: entry.success,
        error: entry.error ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate content.";
    const status = message === "Unauthorized" ? 401 : 500;

    if (userId && parsedInput) {
      try {
        await logGeneration({
          userId,
          sourceUrls: parsedInput.urls,
          tone: parsedInput.tone,
          length: parsedInput.length,
          language: parsedInput.language,
          crawlOk: 0,
          crawlFail: parsedInput.urls.length,
          success: false,
          errorMessage: message,
        });
      } catch {
        // ignore logging failures
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
