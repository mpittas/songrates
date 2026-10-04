"use client";

import { useState, Suspense, useId } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout, { AUTH_INPUT_CLASS } from "@/components/auth/AuthLayout";
import LoginLoading from "./loading";
import { FcGoogle } from "react-icons/fc";
import { FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "@/components/ui/Button";
import {
  buildAuthCallbackUrl,
  getSafeNextPath,
} from "@/lib/auth/redirect";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view");
  const isLogin = view === "login";
  const returnPath = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const usernameId = useId();
  const emailId = useId();
  const passwordId = useId();

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const updatePassword = (value: string) => {
    setPassword(value);
    setPasswordCriteria({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      specialChar: /[@$!%*?&]/.test(value),
    });
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const [supabase] = useState(() => createClient());

  const toggleView = () => {
    const newView = isLogin ? "signup" : "login";
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    setError(null);
    setSuccess(null);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  };

  const handleSocialLogin = async (
    provider: "google" | "apple" | "facebook",
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildAuthCallbackUrl(window.location.origin, returnPath),
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(returnPath);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: buildAuthCallbackUrl(
              window.location.origin,
              returnPath,
            ),
            data: {
              username: username,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          router.push(returnPath);
          router.refresh();
        } else {
          setSuccess("Check your email for the confirmation link!");
        }
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (message.includes("rate limit")) {
        setError("Rate limit exceeded. Please wait a moment.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
        <div className="mb-8">
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-[-0.045em] sm:text-5xl">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-2">
            {isLogin
              ? "Enter your email and password to continue."
              : "Choose a username and password to get started."}
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button
            type="button"
            onClick={() => handleSocialLogin("google")}
            variant="border"
            disabled={loading}
            size="lg"
            className="flex-1"
            iconLeft={<FcGoogle size={18} />}
          >
            Continue with Google
          </Button>
        </div>

        <div className="relative mb-6 flex items-center py-2">
          <div className="grow border-t border-line-strong" />
          <span className="mx-4 shrink-0 text-xs text-ink-2">
            or
          </span>
          <div className="grow border-t border-line-strong" />
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={usernameId} className="text-sm text-ink-2">
                Username
              </label>
              <input
                id={usernameId}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="musiclover99"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                autoComplete="username"
                className={AUTH_INPUT_CLASS}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-sm text-ink-2">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={AUTH_INPUT_CLASS}
            />
          </div>

          <div className="relative flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-sm text-ink-2">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => updatePassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={`${AUTH_INPUT_CLASS} pr-10`}
              />
              <div className="absolute top-1/2 right-2 -translate-y-1/2">
                <Button icon variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </Button>
              </div>
            </div>
            {!isLogin && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <ul className="space-y-1">
                  {[
                    { key: "length", label: "At least 8 characters" },
                    { key: "uppercase", label: "One uppercase letter" },
                    { key: "lowercase", label: "One lowercase letter" },
                    { key: "number", label: "One number" },
                    { key: "specialChar", label: "One special char (@$!%*?&)" },
                  ].map(({ key, label }) => (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      {passwordCriteria[
                        key as keyof typeof passwordCriteria
                      ] ? (
                        <FaCheck className="text-emerald-500" size={10} />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border border-ink-3" />
                      )}
                      <span
                        className={
                          passwordCriteria[key as keyof typeof passwordCriteria]
                            ? "text-emerald-500"
                            : "text-ink-3"
                        }
                      >
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (!isLogin && !isPasswordValid)}
            variant="primary"
            size="lg"
            className="mt-2 w-full"
          >
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1 text-sm text-ink-2">
          <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <Button variant="ghost" size="sm" onClick={toggleView} disabled={loading}>
            {isLogin ? "Create account" : "Sign in"}
          </Button>
        </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
