import { NextRequest } from "next/server";
import { withAdminHandler } from "@/lib/admin/api";
import { listAdminDrafts } from "@/lib/admin/drafts";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  return withAdminHandler(async () => ({ drafts: await listAdminDrafts(search) }));
}
