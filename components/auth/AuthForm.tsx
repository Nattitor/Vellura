"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, login, signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function AuthForm() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setError(null);
    setIsLoginMode((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = isLoginMode 
        ? await login(formData)
        : await signup(formData);
        
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleGoogleSignIn = () => {
    setError(null);
    startTransition(async () => {
      await signInWithGoogle();
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isLoginMode ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isLoginMode 
            ? "Sign in to access your workspace" 
            : "Sign up to start generating cover letters"}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full mb-6 border-white/10 bg-zinc-900/50 hover:bg-zinc-800 text-white relative active:scale-[0.98] transition-all"
        onClick={handleGoogleSignIn}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="relative w-full mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0f0f12] px-2 text-zinc-500 rounded">
            Or continue with email
          </span>
        </div>
      </div>

      <div className="w-full relative h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.form
            key={isLoginMode ? "login" : "signup"}
            initial={{ opacity: 0, x: isLoginMode ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLoginMode ? 20 : -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            onSubmit={handleSubmit}
            className="w-full absolute top-0 left-0"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-amethyst-glow"
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-amethyst-glow"
                  disabled={isPending}
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amethyst-glow hover:bg-amethyst-glow/90 text-white mt-2 active:scale-[0.98] transition-transform"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoginMode ? "Sign In" : "Sign Up"}
              </Button>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>

      <div className="mt-4 text-center relative z-10">
        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer p-2"
          disabled={isPending}
        >
          {isLoginMode 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
