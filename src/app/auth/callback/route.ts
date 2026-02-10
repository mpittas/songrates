import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function getRedirectUrl(
  request: Request,
  origin: string,
  path: string,
): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return `${origin}${path}`;
  } else if (forwardedHost) {
    return `https://${forwardedHost}${path}`;
  }
  return `${origin}${path}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get("next") ?? "/";

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
            getRedirectUrl(request, origin, "/complete-profile"),
          );
        }
      }

      return NextResponse.redirect(getRedirectUrl(request, origin, next));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
