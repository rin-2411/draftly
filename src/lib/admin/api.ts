import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";

export async function withAdminHandler<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    await requireAdminUser();
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin request failed.";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
