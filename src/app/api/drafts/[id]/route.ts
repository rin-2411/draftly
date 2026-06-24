import { NextResponse } from "next/server";
import { deleteDraftById, getDraftById, updateDraftById } from "@/lib/drafts";
import { draftUpdateSchema } from "@/lib/validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const draft = await getDraftById(id);
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch draft.";
    const status = message === "Unauthorized" ? 401 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const parsed = draftUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const draft = await updateDraftById(id, parsed.data);
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update draft.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteDraftById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete draft.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
