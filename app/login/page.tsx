import { Suspense } from "react";
import { VelluraLogo } from "@/components/ui/vellura-logo";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-deep-void selection:bg-amethyst-glow/30 selection:text-white select-none">
      {/* Left Side: Brand Showcase */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8 md:p-16 lg:p-24 relative overflow-hidden select-none">
        {/* Subtle glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amethyst-glow/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center text-center max-w-md">
          <VelluraLogo className="w-20 h-20 sm:w-32 sm:h-32 md:w-44 md:h-44 mb-3 sm:mb-4 drop-shadow-2xl" />
          <h1 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight text-white mb-2">
            Vellura
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg md:text-xl font-light">
            The intelligent workspace for your career.
          </p>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative border-t md:border-t-0 md:border-l border-white/5">
        <div className="w-full max-w-md ethereal-panel p-6 sm:p-8 md:p-10">
          <Suspense fallback={<div className="w-full h-72 flex items-center justify-center text-zinc-500 text-xs">Cargando...</div>}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
