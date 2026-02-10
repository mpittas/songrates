"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import MeshGradient from "@/components/mesh/MeshGradient";
import { MeshGradientConfig } from "@/components/mesh/types";
import { FcGoogle } from "react-icons/fc";
import { FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "@/components/ui/Button";

const greenMeshConfig: MeshGradientConfig = {
  speed: 0.2, // Slower for a calmer vibe
  zoom: 1.2,
  amplitude: 0.4,
  contrast: 1.2,
  noise: 0.05,
  color1: "#10b981", // Emerald 500
  color2: "#022c22", // Emerald 900 (Darker base)
};

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view");
  const isLogin = view === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
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
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: firstName,
              last_name: lastName,
              username: username,
            },
          },
        });
        if (error) throw error;
        setSuccess("Check your email for the confirmation link!");
      }
    } catch (err: any) {
      if (err.message && err.message.includes("rate limit")) {
        setError("Rate limit exceeded. Please wait a moment.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-65px)] grid grid-cols-1 md:grid-cols-2 bg-black">
      {/* Left Column: Green Gradient */}
      <div className="relative hidden md:block h-full w-full overflow-hidden">
        <MeshGradient
          config={greenMeshConfig}
          className="absolute inset-0 w-full h-full opacity-80"
        />
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-col justify-center p-6 md:p-12 bg-black relative w-full max-w-[600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl text-white mb-2 tracking-tight">
            {isLogin ? "Welcome Back" : "Sign Up Account"}
          </h1>
          <p className="text-neutral-500 text-sm">
            {isLogin
              ? "Enter your credentials to access your account."
              : "Enter your personal data to create your account."}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-4 mb-6">
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

        {/* Separator */}
        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-neutral-600 text-xs uppercase">
            Or
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm text-neutral-500">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="eg. John"
                    className="w-full bg-[#1A1A1A] border-none text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm text-neutral-500">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="eg. Francisco"
                    className="w-full bg-[#1A1A1A] border-none text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-neutral-500">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="eg. musiclover99"
                  required
                  className="w-full bg-[#1A1A1A] border-none text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eg. johnfrans@gmail.com"
              required
              className="w-full bg-[#1A1A1A] border-none text-white text-sm px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-sm text-neutral-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => updatePassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-[#1A1A1A] border-none text-white text-sm px-4 py-3 pr-10 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
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
            <div className="text-red-500 text-sm bg-red-500/10 p-2 border border-red-500/20 rounded-none">
              {error}
            </div>
          )}
          {success && (
            <div className="text-emerald-500 text-sm bg-emerald-500/10 p-2 border border-emerald-500/20 rounded-none">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (!isLogin && !isPasswordValid)}
            variant="secondary"
            size="md"
            className="mt-4 w-full"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-neutral-500 text-center">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleView}
            className="text-white hover:underline font-medium"
          >
            {isLogin ? "Sign Up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}
