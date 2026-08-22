"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VelluraLogo } from "@/components/ui/vellura-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/actions/auth";

export function Topbar({ userEmail, credits = 0 }: { userEmail: string; credits?: number }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Generate", href: "/dashboard" },
    { name: "History", href: "/dashboard/history" },
    { name: "Settings", href: "/dashboard/settings" },
  ];

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
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Credits & Profile */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-amethyst-glow/10 border border-amethyst-glow/20">
            <span className="text-xs font-medium text-amethyst-glow">
              ✨ {credits} Credits
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Avatar className="h-8 w-8 border border-white/10 hover:border-white/30 transition-colors">
                <AvatarFallback className="bg-zinc-800 text-xs text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10 text-white">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-zinc-400">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => logout()}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
}
