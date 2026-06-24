import { NextResponse } from "next/server";
import { createDraft, getDrafts } from "@/lib/drafts";
import { draftCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const drafts = await getDrafts();
    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch drafts.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = draftCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const { title, content, source_urls, tone, length } = parsed.data;
    const draft = await createDraft({
      title: title?.trim() || "Untitled Draft",
      content,
      sourceUrls: source_urls ?? [],
      tone: tone ?? "formal",
      length: length ?? "medium",
    });

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create draft.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
