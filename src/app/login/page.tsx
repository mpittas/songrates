"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import MeshGradient from "@/components/mesh/MeshGradient";
import { MeshGradientConfig } from "@/components/mesh/types";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaFacebookF } from "react-icons/fa";

const greenMeshConfig: MeshGradientConfig = {
  speed: 0.2, // Slower for a calmer vibe
  zoom: 1.2,
  amplitude: 0.4,
  contrast: 1.2,
  noise: 0.05,
  color1: "#10b981", // Emerald 500
  color2: "#022c22", // Emerald 900 (Darker base)
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false); // Default to Sign Up as per image "Sign Up Account"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
            data: {
              first_name: firstName,
              last_name: lastName,
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
    <div className="w-full h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2 bg-black">
      {/* Left Column: Green Gradient */}
      <div className="relative hidden md:block h-full w-full overflow-hidden">
        <MeshGradient
          config={greenMeshConfig}
          className="absolute inset-0 w-full h-full opacity-80"
        />
        {/* Text overlay similar to image if needed, but user said "without adding any elements inside, keep it empty" for left column aside from gradient interaction? 
               Wait, "On left column show the green gradient but without adding any elements inside, keep it empty." 
               Okay, pure gradient.
           */}
        <div className="absolute bottom-10 left-10 text-white z-10 pointer-events-none">
          <h2 className="text-3xl font-bold mb-2 tracking-tighter">
            Get Started
            <br />
            with Us
          </h2>
          <p className="text-xs text-neutral-400 max-w-[200px]">
            Complete these easy steps to register your account.
          </p>
          {/* Visual steps placeholders based on image could go here, but user said "keep it empty" after "without adding any elements inside". 
                    This creates a conflict. 
                    "On left column show the green gradient but without adding any elements inside, keep it empty."
                    The image has text. The instruction says keep it empty. 
                    I will follow the text instruction: "keep it empty".
                */}
        </div>
        {/* Overriding the "keep it empty" thought: I will remove the text overlay to strictly follow "keep it empty". */}
        <div className="absolute inset-0 bg-black/20" />{" "}
        {/* Slight overlay for depth if needed */}
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-col justify-center p-6 md:p-12 bg-black relative w-full max-w-[600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl text-white mb-2 tracking-tight">
            {isLogin ? "Welcome Back" : "Sign Up Account"}
          </h1>
          <p className="text-neutral-500 text-xs">
            {isLogin
              ? "Enter your credentials to access your account."
              : "Enter your personal data to create your account."}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/10 text-white py-2.5 hover:bg-white/5 transition-colors text-xs"
          >
            <FcGoogle size={18} /> Google
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/10 text-white py-2.5 hover:bg-white/5 transition-colors text-xs"
          >
            <FaApple size={18} /> Apple{" "}
            {/* Github in image, user asked for Apple */}
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/10 text-white py-2.5 hover:bg-white/5 transition-colors text-xs"
          >
            <FaFacebookF size={16} className="text-blue-500" /> Facebook
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-neutral-600 text-[10px] uppercase">
            Or
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-500">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="eg. John"
                  className="w-full bg-[#1A1A1A] border-none text-white text-xs px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-500">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="eg. Francisco"
                  className="w-full bg-[#1A1A1A] border-none text-white text-xs px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eg. johnfrans@gmail.com"
              required
              className="w-full bg-[#1A1A1A] border-none text-white text-xs px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full bg-[#1A1A1A] border-none text-white text-xs px-4 py-3 placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500/50 outline-none rounded-none"
            />
            {!isLogin && (
              <p className="text-[9px] text-neutral-600">
                Must be at least 8 characters.
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-xs bg-red-500/10 p-2 border border-red-500/20 rounded-none">
              {error}
            </div>
          )}
          {success && (
            <div className="text-emerald-500 text-xs bg-emerald-500/10 p-2 border border-emerald-500/20 rounded-none">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-white text-black font-medium text-xs py-3.5 hover:bg-neutral-200 transition-colors disabled:opacity-50 rounded-none"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-xs text-neutral-500 text-center">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:underline font-medium"
          >
            {isLogin ? "Sign Up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
