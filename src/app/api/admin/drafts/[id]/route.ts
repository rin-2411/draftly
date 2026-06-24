import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { deleteAdminDraft } from "@/lib/admin/drafts";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    await deleteAdminDraft(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
