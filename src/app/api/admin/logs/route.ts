import { withAdminHandler } from "@/lib/admin/api";
import { listGenerationLogs } from "@/lib/admin/logs";

export async function GET() {
  return withAdminHandler(async () => ({ logs: await listGenerationLogs(80) }));
}
