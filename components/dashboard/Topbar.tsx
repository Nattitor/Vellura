"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Camera, Trash2, Settings, LogOut } from "lucide-react";
import { VelluraLogo } from "@/components/ui/vellura-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "@/app/actions/auth";
import { useLanguage } from "@/components/providers/language-provider";
import { useAvatar } from "@/components/providers/avatar-provider";
import { useQuota } from "@/components/providers/quota-provider";

export function Topbar({ userEmail }: { userEmail: string; dailyLimit?: number }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { avatarUrl, uploadAvatar, removeAvatar } = useAvatar();
  const { dailyLimit } = useQuota();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = "";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <VelluraLogo className="w-8 h-8" />
            <span className="font-sans font-bold text-lg tracking-tight text-white hidden sm:inline-block">
              Vellura
            </span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-4">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.nav.generate}
          </Link>
          <Link
            href="/dashboard/history"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/dashboard/history"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.nav.history}
          </Link>
          <Link
            href="/dashboard/settings"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/dashboard/settings"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.nav.settings}
          </Link>
        </nav>

        {/* Right: Credits & Profile */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-amethyst-glow/10 border border-amethyst-glow/20">
            <span className="text-xs font-medium text-amethyst-glow flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {dailyLimit} {t.nav.limitLeft}
            </span>
          </div>

          {/* Hidden File Input for Avatar Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
          />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none focus:ring-2 focus:ring-amethyst-glow/50 rounded-full transition-all flex items-center justify-center cursor-pointer"
              aria-expanded={isOpen}
            >
              <Avatar className="h-8 w-8 border border-white/10 hover:border-amethyst-glow/50 transition-colors">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-zinc-800 text-xs font-semibold text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-950/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl p-1.5 rounded-xl z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="p-2">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="relative group/avatar cursor-pointer" 
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      <Avatar className="h-10 w-10 border border-white/10">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="Avatar" />
                        ) : null}
                        <AvatarFallback className="bg-zinc-800 text-sm font-semibold text-white">
                          {userEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{t.nav.account}</p>
                      <p className="text-xs text-zinc-400 truncate" title={userEmail}>
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/10 my-1" />

                <button 
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsOpen(false);
                  }} 
                  className="w-full hover:bg-white/10 text-zinc-200 hover:text-white transition-colors cursor-pointer py-2 px-2.5 text-xs flex items-center gap-2 rounded-lg text-left"
                >
                  <Camera className="w-3.5 h-3.5 text-amethyst-glow" />
                  <span>{t.nav.changeAvatar}</span>
                </button>

                {avatarUrl && (
                  <button 
                    type="button"
                    onClick={() => {
                      removeAvatar();
                      setIsOpen(false);
                    }} 
                    className="w-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer py-2 px-2.5 text-xs flex items-center gap-2 rounded-lg text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{t.nav.removeAvatar}</span>
                  </button>
                )}

                <Link 
                  href="/dashboard/settings" 
                  onClick={() => setIsOpen(false)}
                  className="w-full hover:bg-white/10 text-zinc-200 hover:text-white transition-colors cursor-pointer py-2 px-2.5 text-xs rounded-lg flex items-center gap-2 block"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.nav.settings}</span>
                </Link>

                <div className="h-px bg-white/10 my-1" />

                <button 
                  type="button"
                  onClick={() => logout()}
                  className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer py-2 px-2.5 text-xs flex items-center gap-2 rounded-lg text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>{t.nav.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
