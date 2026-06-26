import { getRedirectUrl, getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has set a username
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile row exists (handle race condition with trigger)
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            display_name: user.user_metadata?.username || user.email || null,
          },
          { onConflict: "id", ignoreDuplicates: true },
        );

        // Check if profile has username
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        // If no username, redirect to complete-profile
        if (!profile?.username) {
          return NextResponse.redirect(
            getRedirectUrl(request, "/complete-profile"),
          );
        }
      }

      return NextResponse.redirect(getRedirectUrl(request, next));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(getRedirectUrl(request, "/auth/auth-code-error"));
}
