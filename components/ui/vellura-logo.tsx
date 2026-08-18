import * as React from "react";

export function VelluraLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Amethyst Glow for the left fold */}
        <linearGradient id="amethystGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
        </linearGradient>

        {/* Neon Cyan for the right fold */}
        <linearGradient id="neonCyan" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
        </linearGradient>

        {/* Sharp bright highlight for the fold edge */}
        <linearGradient id="foldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Left Fold */}
      <path
        d="M15 35 L45 90 L55 15 Z"
        fill="url(#amethystGlow)"
        style={{ mixBlendMode: "screen" }}
      />
      
      {/* Right Fold (Asymmetric) */}
      <path
        d="M95 20 L45 90 L55 15 Z"
        fill="url(#neonCyan)"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Central Fold Edge Highlight */}
      <path
        d="M54 15 L44.5 90 L45.5 90 L55 15 Z"
        fill="url(#foldHighlight)"
      />
    </svg>
  );
}
