import { NextResponse } from "next/server";
import {
  deleteResearchSource,
  getResearchSourceById,
  updateResearchSource,
} from "@/lib/research-library";
import { researchSourceUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const source = await getResearchSourceById(id);
    return NextResponse.json({ source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load source.";
    const status =
      message === "Unauthorized" ? 401 : message === "Source not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = researchSourceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const patch = parsed.data;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const source = await updateResearchSource(id, patch);

    return NextResponse.json({ source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update source.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await deleteResearchSource(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete source.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
