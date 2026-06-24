import { NextResponse } from "next/server";
import { withAdminHandler } from "@/lib/admin/api";
import { getSystemSettings, updateSystemSettings } from "@/lib/admin/settings";
import { requireAdminUser } from "@/lib/admin/auth";
import { adminSettingsPatchSchema } from "@/lib/validation";

export async function GET() {
  return withAdminHandler(async () => ({ settings: await getSystemSettings() }));
}

export async function PATCH(request: Request) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const parsed = adminSettingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }
    const settings = await updateSystemSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
