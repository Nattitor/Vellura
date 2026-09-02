"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, login, signup, requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Lock, 
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "sonner";

type AuthMode = "login" | "signup" | "forgot";

export function AuthForm() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  
  const isExpired = searchParams.get("expired") === "true";
  const isVerified = searchParams.get("verified") === "true";
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(urlError ? "Could not authenticate. Please try again." : null);
  
  // Success states
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleModeChange = (newMode: AuthMode) => {
    setError(null);
    setVerificationEmail(null);
    setResetEmailSent(false);
    setMode(newMode);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("preferredLanguage", language);
    
    startTransition(async () => {
      if (mode === "login") {
        const result = await login(formData);
        if (result?.error) {
          setError(result.error);
        }
      } else if (mode === "signup") {
        const result = await signup(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.requiresVerification) {
          setVerificationEmail(result.email || "");
          toast.success(t.auth.checkEmailTitle || "Revisa tu correo para confirmar tu cuenta.");
        }
      } else if (mode === "forgot") {
        const result = await requestPasswordReset(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setResetEmailSent(true);
          toast.success(t.auth.resetEmailSentTitle || "Enlace de recuperación enviado");
        }
      }
    });
  };

  const handleGoogleSignIn = () => {
    setError(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
        toast.error(`Error con Google: ${result.error}`);
      }
    });
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Session Expired Banner */}
      {isExpired && (
        <div className="w-full mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-300 text-xs animate-in fade-in duration-300">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{t.auth.sessionExpiredNotice || "Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente."}</span>
        </div>
      )}

      {/* Email Verified Banner */}
      {isVerified && (
        <div className="w-full mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{t.auth.emailVerifiedNotice || "¡Correo confirmado con éxito! Ya puedes iniciar sesión."}</span>
        </div>
      )}

      {/* Verification Email Sent Card */}
      {verificationEmail ? (
        <div className="w-full py-4 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-amethyst-glow/15 border border-amethyst-glow/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Mail className="w-7 h-7 text-amethyst-glow animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">
              {t.auth.checkEmailTitle || "Revisa tu correo electrónico"}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              {t.auth.checkEmailDesc || "Te enviamos un enlace de confirmación a"}{" "}
              <span className="text-white font-mono font-medium">{verificationEmail}</span>.
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
            {t.auth.checkEmailInstructions || "Haz clic en el enlace del correo para activar tu cuenta y acceder a tu espacio de trabajo."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleModeChange("login")}
            className="w-full mt-2 border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-white text-xs cursor-pointer"
          >
            {t.auth.backToSignIn || "Volver a Iniciar Sesión"}
          </Button>
        </div>
      ) : resetEmailSent ? (
        /* Password Reset Email Sent Card */
        <div className="w-full py-4 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <KeyRound className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">
              {t.auth.resetEmailSentTitle || "Enlace enviado"}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              {t.auth.resetEmailSentDesc || "Si existe una cuenta registrada con este correo, recibirás un enlace de recuperación en breve."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleModeChange("login")}
            className="w-full mt-2 border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-white text-xs cursor-pointer"
          >
            {t.auth.backToSignIn || "Volver a Iniciar Sesión"}
          </Button>
        </div>
      ) : (
        /* Standard Forms (Login / Signup / Forgot) */
        <>
          {/* Header Title */}
          <div className="w-full mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
              {mode === "login"
                ? (t.auth.welcomeBack || "Bienvenido de nuevo")
                : mode === "signup"
                  ? (t.auth.createAccount || "Crear una cuenta")
                  : (t.auth.forgotPasswordTitle || "Recuperar Contraseña")}
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {mode === "login"
                ? (t.auth.signInSubtitle || "Inicia sesión para acceder a tu espacio de trabajo")
                : mode === "signup"
                  ? (t.auth.signUpSubtitle || "Regístrate para comenzar a crear tus cartas a medida")
                  : (t.auth.forgotPasswordSubtitle || "Ingresa tu correo y te enviaremos un enlace de recuperación")}
            </p>
          </div>

          {/* Google OAuth Button (Only in Login & Signup) */}
          {mode !== "forgot" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-5 border-white/10 bg-zinc-900/50 hover:bg-zinc-800 text-white text-xs h-10 relative active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2.5"
                onClick={handleGoogleSignIn}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 6.9 9.2 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3l3.6 2.8c2.1-1.9 3.2-4.8 3.2-8.1z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.9 14.1c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5L2.2 17C4 20.5 7.7 23 12 23z"
                    />
                  </svg>
                )}
                <span>{t.auth.continueWithGoogle || "Continuar con Google"}</span>
              </Button>

              <div className="relative w-full mb-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                  <span className="bg-[#0f0f12] px-2 text-zinc-500 rounded">
                    {t.auth.orWithEmail || "O continúa con correo"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <div className="w-full relative min-h-[220px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="w-full flex flex-col space-y-3.5"
              >
                {/* Email Field */}
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="email" className="text-xs text-zinc-300 select-none">
                    {t.auth.emailLabel || "Correo electrónico"}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder || "name@example.com"}
                    required
                    className="bg-zinc-900/50 border-white/10 text-white text-xs h-9 focus-visible:ring-amethyst-glow select-text"
                    disabled={isPending}
                  />
                </div>

                {/* Password Field (Only for Login and Signup) */}
                {mode !== "forgot" && (
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs text-zinc-300 select-none">
                        {t.auth.passwordLabel || "Contraseña"}
                      </Label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => handleModeChange("forgot")}
                          className="text-[11px] text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {t.auth.forgotPasswordLink || "¿Olvidaste tu contraseña?"}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className="bg-zinc-900/50 border-white/10 text-white text-xs h-9 pr-9 focus-visible:ring-amethyst-glow select-text"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer p-0.5"
                        tabIndex={-1}
                        title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-300" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 px-3 py-2 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-amethyst-glow hover:bg-amethyst-glow/90 text-white text-xs font-semibold h-10 mt-2 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)] flex items-center justify-center gap-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "forgot" ? (
                    <KeyRound className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPending 
                      ? (t.settings.saving || "Procesando...")
                      : mode === "login"
                        ? (t.auth.signInBtn || "Iniciar Sesión")
                        : mode === "signup"
                          ? (t.auth.signUpBtn || "Crear Cuenta")
                          : (t.auth.sendResetLinkBtn || "Enviar Enlace de Recuperación")}
                  </span>
                </Button>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Mode Switchers */}
          <div className="mt-4 text-center relative z-10 select-none">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto p-1.5"
                disabled={isPending}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.auth.backToSignIn || "Volver a Iniciar Sesión"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleModeChange(mode === "login" ? "signup" : "login")}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer p-1.5"
                disabled={isPending}
              >
                {mode === "login" 
                  ? (t.auth.noAccountPrompt || "¿No tienes una cuenta? Regístrate") 
                  : (t.auth.haveAccountPrompt || "¿Ya tienes una cuenta? Inicia sesión")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
