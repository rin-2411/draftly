import { withAdminHandler } from "@/lib/admin/api";
import { getAdminDashboardStats } from "@/lib/admin/stats";

export async function GET() {
  return withAdminHandler(async () => ({ stats: await getAdminDashboardStats() }));
}
