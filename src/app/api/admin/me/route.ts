import { NextResponse } from "next/server";
import { getSessionUser, isAdminUser } from "@/lib/admin/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ isAdmin: false, authenticated: false });
  }
  return NextResponse.json({ isAdmin: isAdminUser(user), authenticated: true });
}
