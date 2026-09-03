"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, History, Settings } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

// F1 mobile: bottom tab bar (phones only — md+ keeps the Topbar links).
const TABS = [
  { href: "/dashboard", match: (p: string) => p === "/dashboard", icon: Zap, key: "generate" },
  { href: "/dashboard/history", match: (p: string) => p.startsWith("/dashboard/history"), icon: History, key: "history" },
  { href: "/dashboard/settings", match: (p: string) => p.startsWith("/dashboard/settings"), icon: Settings, key: "settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const labels = t.nav as unknown as Record<string, string>;

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl"
    >
      <div className="grid grid-cols-3 px-2 pt-1 pb-safe">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors",
                active ? "text-white" : "text-zinc-500 active:text-zinc-200"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full px-5 py-1 transition-all",
                  active && "bg-amethyst-glow/20 shadow-[0_0_14px_rgba(139,92,246,0.35)]"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-amethyst-glow" : "text-zinc-500")} />
              </span>
              {labels[tab.key] || tab.key}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
