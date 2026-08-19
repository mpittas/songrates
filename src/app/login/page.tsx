"use client";

import { useState, Suspense, useId } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import MeshGradient from "@/components/mesh/MeshGradient";
import { MeshGradientConfig } from "@/components/mesh/types";
import { FcGoogle } from "react-icons/fc";
import { FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "@/components/ui/Button";
import {
  buildAuthCallbackUrl,
  getSafeNextPath,
} from "@/lib/auth/redirect";

const warmMeshConfig: MeshGradientConfig = {
  speed: 0.2,
  zoom: 1.2,
  amplitude: 0.4,
  contrast: 1.2,
  noise: 0.05,
  color1: "#f05f45",
  color2: "#181018",
};

const AUTH_INPUT_CLASS =
  "w-full rounded-md border border-[#d8d8d8] bg-white px-4 py-3 text-sm text-neutral-900 outline-hidden placeholder:text-neutral-500 focus:border-neutral-400";

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

  const supabase = createClient();

  const toggleView = () => {
    const newView = isLogin ? "signup" : "login";
    router.replace(`/login?view=${newView}`, { scroll: false });
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
    <div className="grid h-[calc(100vh-65px)] w-full grid-cols-1 bg-[#ebe8e5] md:grid-cols-2">
      <div className="relative hidden h-full w-full overflow-hidden md:block">
        <MeshGradient
          config={warmMeshConfig}
          className="absolute inset-0 h-full w-full opacity-80"
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[600px] flex-col justify-center bg-[#ebe8e5] p-6 md:p-12">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl tracking-tight text-neutral-900">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-neutral-600">
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
            size="md"
            className="flex-1"
            iconLeft={<FcGoogle size={18} />}
          >
            Google
          </Button>
        </div>

        <div className="relative mb-6 flex items-center py-2">
          <div className="grow border-t border-[#d9d9d9]" />
          <span className="mx-4 shrink-0 text-xs text-neutral-600">
            or
          </span>
          <div className="grow border-t border-[#d9d9d9]" />
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={usernameId} className="text-sm text-neutral-600">
                Username
              </label>
              <input
                id={usernameId}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="eg. musiclover99"
                required
                autoComplete="username"
                className={AUTH_INPUT_CLASS}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-sm text-neutral-600">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eg. you@example.com"
              required
              autoComplete="email"
              className={AUTH_INPUT_CLASS}
            />
          </div>

          <div className="relative flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-sm text-neutral-600">
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-neutral-500 transition-colors hover:text-neutral-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
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
                        <div className="w-2.5 h-2.5 rounded-full border border-neutral-600" />
                      )}
                      <span
                        className={
                          passwordCriteria[key as keyof typeof passwordCriteria]
                            ? "text-emerald-500"
                            : "text-neutral-500"
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
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (!isLogin && !isPasswordValid)}
            variant="primary"
            size="md"
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

        <p
          className={
            isLogin
              ? "mt-6 text-center text-base text-neutral-700"
              : "mt-6 text-center text-sm text-neutral-600"
          }
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={toggleView}
            className={
              isLogin
                ? "cursor-pointer font-semibold text-neutral-900 underline decoration-2 underline-offset-4 hover:text-black"
                : "cursor-pointer font-medium text-neutral-900 hover:underline"
            }
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#ebe8e5]" />}>
      <LoginContent />
    </Suspense>
  );
}
