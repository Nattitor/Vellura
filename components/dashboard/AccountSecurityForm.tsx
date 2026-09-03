"use client";

import { useState, useTransition } from "react";
import { updateUserPassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Lock,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "sonner";

interface AuthDetails {
  email: string;
  hasGoogle: boolean;
  hasPassword: boolean;
}

export function AccountSecurityForm({ authDetails }: { authDetails?: AuthDetails | null }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasPasswordLocal, setHasPasswordLocal] = useState(authDetails?.hasPassword ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(t.settings.securityPasswordLength || "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.settings.securityPasswordMismatch || "Las contraseñas no coinciden.");
      return;
    }

    const formData = new FormData();
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    startTransition(async () => {
      const result = await updateUserPassword(formData);
      if (result.error) {
        setError(result.error);
        toast.error(`Error: ${result.error}`);
      } else {
        setHasPasswordLocal(true);
        setNewPassword("");
        setConfirmPassword("");
        toast.success(t.settings.securityPasswordSuccess || "Contraseña establecida con éxito. Ahora puedes iniciar sesión con tu correo y contraseña.");
      }
    });
  };

  return (
    <div className="w-full ethereal-panel p-6 md:p-8 rounded-xl flex flex-col space-y-6 relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amethyst-glow/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amethyst-glow/10 transition-colors duration-1000" />

      {/* Header */}
      <div className="flex flex-col space-y-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amethyst-glow/10 border border-amethyst-glow/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-amethyst-glow" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white leading-tight">
              {t.settings.securityTitle || "Seguridad y Acceso"}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.settings.securitySubtitle || "Gestiona tu contraseña y los métodos de autenticación vinculados a tu cuenta."}
            </p>
          </div>
        </div>
      </div>

      {/* Account Info & Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        {/* Email Address */}
        <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-white/5 flex items-center gap-3">
          <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              {t.settings.securityEmailLabel || "Correo Principal"}
            </div>
            <div className="text-xs font-mono text-zinc-200 truncate mt-0.5">
              {authDetails?.email || "usuario@ejemplo.com"}
            </div>
          </div>
        </div>

        {/* Linked Authentication Methods */}
        <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-white/5 flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">
            {t.settings.securityMethodsLabel || "Métodos Conectados"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {authDetails?.hasGoogle && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Google
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
              hasPasswordLocal 
                ? "bg-cyan-950/40 border border-cyan-500/30 text-cyan-300"
                : "bg-zinc-800/60 border border-white/10 text-zinc-400"
            }`}>
              {hasPasswordLocal ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  {t.settings.securityPasswordActive || "Contraseña Activa"}
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-zinc-500" />
                  {t.settings.securityNoPassword || "Sin Contraseña"}
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5 relative z-10" />

      {/* Password Management Form */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 relative z-10">
        <div className="flex flex-col space-y-1">
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amethyst-glow" />
            {hasPasswordLocal 
              ? (t.settings.securityChangePasswordTitle || "Cambiar Contraseña")
              : (t.settings.securitySetPasswordTitle || "Establecer Contraseña")}
          </h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {t.settings.securityPasswordExplanation || "Si iniciaste sesión con Google, definir una contraseña te permitirá ingresar con tu correo y contraseña o con Google al mismo perfil e historial."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* New Password */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs text-zinc-300">
              {t.settings.securityNewPasswordLabel || "Nueva Contraseña"}
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-zinc-900/50 border-white/10 text-white text-base sm:text-xs h-12 sm:h-9 pr-11 focus-visible:ring-amethyst-glow"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors touch-target flex items-center justify-center"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs text-zinc-300">
              {t.settings.securityConfirmPasswordLabel || "Confirmar Contraseña"}
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-zinc-900/50 border-white/10 text-white text-base sm:text-xs h-12 sm:h-9 focus-visible:ring-amethyst-glow"
              disabled={isPending}
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isPending || !newPassword || !confirmPassword}
            className="bg-amethyst-glow hover:bg-amethyst-glow/90 text-white text-xs font-semibold h-11 sm:h-9 px-4 rounded-lg cursor-pointer transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] disabled:opacity-50 flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {isPending 
                ? (t.settings.saving || "Guardando...")
                : hasPasswordLocal
                  ? (t.settings.securityUpdatePasswordBtn || "Actualizar Contraseña")
                  : (t.settings.securitySetPasswordBtn || "Establecer Contraseña")}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
