import { NextResponse } from "next/server";
import { createClient } from "@/config/supabase/server";
import { userPreferencesPatchSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = userPreferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    const patch = parsed.data;
    const merged: Record<string, unknown> = { ...(user.user_metadata ?? {}) };

    if (patch.tone !== undefined) merged.default_tone = patch.tone;
    if (patch.length !== undefined) merged.default_length = patch.length;
    if (patch.language !== undefined) merged.default_language = patch.language;
    if (patch.display_name !== undefined) {
      if (patch.display_name === "") {
        delete merged.display_name;
      } else {
        merged.display_name = patch.display_name;
      }
    }

    const { data, error } = await supabase.auth.updateUser({
      data: merged,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        email: data.user?.email ?? null,
        user_metadata: data.user?.user_metadata ?? {},
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save preferences.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
