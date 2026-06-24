import { NextResponse } from "next/server";
import { createResearchSource, listResearchSources } from "@/lib/research-library";
import { researchSourceCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const sources = await listResearchSources();
    return NextResponse.json({ sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch sources.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = researchSourceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const { url, title, notes, tags } = parsed.data;
    const source = await createResearchSource({
      url,
      title: title ?? null,
      notes: notes ?? null,
      tags: tags ?? [],
    });

    return NextResponse.json({ source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create source.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
