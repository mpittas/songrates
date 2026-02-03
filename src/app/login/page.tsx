"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import MySection from "@/components/MySection";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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
          },
        });
        if (error) throw error;
        setSuccess("Check your email for the confirmation link!");
      }
    } catch (err: any) {
      if (err.message && err.message.includes("rate limit")) {
        setError(
          "Rate limit exceeded. Please wait a moment or check your email for a previous link. (Dev Note: You may need to disable email confirmation in Supabase dashboard)",
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MySection className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-[#0A0A0E]/80 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-[#00f0ff]/30 group">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-mono tracking-tighter text-white">
              {isLogin ? "welcome_back" : "create_account"}
            </h1>
            <p className="text-sm text-neutral-400 font-mono">
              {isLogin
                ? "enter your credentials to continue"
                : "join the community of music discovery"}
            </p>
          </div>

          <div className="flex p-1 rounded-lg bg-white/5 border border-white/5">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccess(null);
              }}
              className={cn(
                "flex-1 py-2 text-xs font-mono transition-all duration-300 rounded-md",
                isLogin
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccess(null);
              }}
              className={cn(
                "flex-1 py-2 text-xs font-mono transition-all duration-300 rounded-md",
                !isLogin
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              sign_up
            </button>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 ml-1">
                email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 ml-1">
                password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono animate-in fade-in slide-in-from-top-1">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-white text-black font-mono text-sm py-3 rounded-xl hover:bg-[#00f0ff] hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? "processing..." : isLogin ? "login" : "sign_up"}
            </button>
          </form>

          <p className="text-[10px] text-neutral-600 text-center font-mono">
            BY CONTINUING, YOU AGREE TO OUR TERMS OF SERVICE.
          </p>
        </div>
      </div>
    </MySection>
  );
}
