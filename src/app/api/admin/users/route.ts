import { withAdminHandler } from "@/lib/admin/api";
import { listAdminUsers } from "@/lib/admin/users";

export async function GET() {
  return withAdminHandler(async () => ({ users: await listAdminUsers() }));
}
