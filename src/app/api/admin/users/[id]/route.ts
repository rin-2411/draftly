import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { updateAdminUser } from "@/lib/admin/users";
import { adminUserPatchSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminUserPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }
    if (parsed.data.role === undefined && parsed.data.is_disabled === undefined) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }
    await updateAdminUser(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
