import * as React from "react";

export function VelluraLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* =========================
            PURPLE
        ========================== */}

        <linearGradient
          id="vellura-purple-edge"
          x1="110"
          y1="220"
          x2="400"
          y2="780"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6741C8" />
          <stop offset="0.45" stopColor="#974BEE" />
          <stop offset="0.75" stopColor="#D66BEA" />
          <stop offset="1" stopColor="#8C4AE1" />
        </linearGradient>

        <linearGradient
          id="vellura-purple-main"
          x1="170"
          y1="230"
          x2="430"
          y2="770"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#37216D" />
          <stop offset="0.35" stopColor="#6631B5" />
          <stop offset="0.68" stopColor="#8A28C9" />
          <stop offset="1" stopColor="#A85EE5" />
        </linearGradient>

        <linearGradient
          id="vellura-purple-light"
          x1="190"
          y1="220"
          x2="400"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#9A6DE9" stopOpacity="0.15" />
          <stop offset="0.55" stopColor="#9C54F5" stopOpacity="0.8" />
          <stop offset="1" stopColor="#D56DF3" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient
          id="vellura-purple-shadow"
          x1="150"
          y1="300"
          x2="420"
          y2="760"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#21164B" stopOpacity="0.75" />
          <stop offset="0.55" stopColor="#3C237D" stopOpacity="0.4" />
          <stop offset="1" stopColor="#A45DE8" stopOpacity="0.15" />
        </linearGradient>

        {/* =========================
            CYAN
        ========================== */}

        <linearGradient
          id="vellura-cyan-edge"
          x1="890"
          y1="220"
          x2="600"
          y2="780"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#58E8EF" />
          <stop offset="0.3" stopColor="#2CD8E7" />
          <stop offset="0.65" stopColor="#27B9EC" />
          <stop offset="1" stopColor="#4BC9F4" />
        </linearGradient>

        <linearGradient
          id="vellura-cyan-main"
          x1="830"
          y1="230"
          x2="570"
          y2="770"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#42D9E1" />
          <stop offset="0.4" stopColor="#17BDD8" />
          <stop offset="0.72" stopColor="#139AD9" />
          <stop offset="1" stopColor="#1F7BE0" />
        </linearGradient>

        <linearGradient
          id="vellura-cyan-light"
          x1="600"
          y1="220"
          x2="820"
          y2="450"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#B4FFFF" stopOpacity="0.25" />
          <stop offset="0.45" stopColor="#59EEF2" stopOpacity="0.8" />
          <stop offset="1" stopColor="#55D9EF" stopOpacity="0.25" />
        </linearGradient>

        <linearGradient
          id="vellura-cyan-shadow"
          x1="850"
          y1="300"
          x2="580"
          y2="760"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#176F99" stopOpacity="0.45" />
          <stop offset="0.55" stopColor="#0E7EBB" stopOpacity="0.35" />
          <stop offset="1" stopColor="#2460B9" stopOpacity="0.2" />
        </linearGradient>

        {/* =========================
CENTER / CRYSTAL LIGHT
========================== */}

        <radialGradient
          id="vellura-center-glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(500 560) rotate(90) scale(115 95)"
        >
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="0.18" stopColor="#FFFFFF" stopOpacity="0.72" />
          <stop offset="0.38" stopColor="#EAF3FF" stopOpacity="0.42" />
          <stop offset="0.62" stopColor="#D8B8FF" stopOpacity="0.16" />
          <stop offset="1" stopColor="#8B4CFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient
          id="vellura-center"
          x1="450"
          y1="500"
          x2="560"
          y2="760"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#D6CBFF" stopOpacity="0.12" />
          <stop offset="0.32" stopColor="#FFFFFF" stopOpacity="0.78" />
          <stop offset="0.55" stopColor="#E7F7FF" stopOpacity="0.62" />
          <stop offset="0.8" stopColor="#A9E8FF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7ED9FF" stopOpacity="0.12" />
        </linearGradient>

        {/* Reflejo diagonal */}
        <linearGradient
          id="vellura-highlight"
          x1="425"
          y1="520"
          x2="585"
          y2="665"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.38" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="0.52" stopColor="#FFFFFF" stopOpacity="0.88" />
          <stop offset="0.64" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter
          id="vellura-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="12" />
        </filter>

        <filter
          id="vellura-soft-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="4" />
        </filter>

        <filter
          id="vellura-soft-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* =====================================================
          LEFT PURPLE SIDE
          Más ancha y menos alta
      ===================================================== */}

      <path
        d="
          M110 220
          L400 220
          L500 515
          L630 780
          L370 780
          Z
        "
        fill="url(#vellura-purple-edge)"
      />

      <path
        d="
          M120 227
          L397 227
          L500 515
          L370 770
          Z
        "
        fill="url(#vellura-purple-main)"
      />

      {/* Faceta superior */}
      <path
        d="
          M120 227
          L397 227
          L500 515
          Z
        "
        fill="url(#vellura-purple-light)"
      />

      {/* Faceta exterior oscura */}
      <path
        d="
          M120 227
          L370 770
          L500 515
          Z
        "
        fill="url(#vellura-purple-shadow)"
      />

      {/* Faceta interior */}
      <path
        d="
          M500 515
          L370 770
          L500 770
          L565 640
          Z
        "
        fill="#8A42D6"
        fillOpacity="0.22"
      />

      {/* Líneas de cristal */}
      <path
        d="M120 227L500 515L370 770"
        stroke="#C99AFF"
        strokeOpacity="0.32"
        strokeWidth="3"
      />

      <path
        d="M397 227L500 515L370 770"
        stroke="#D9B4FF"
        strokeOpacity="0.18"
        strokeWidth="3"
      />

      {/* =====================================================
          RIGHT CYAN SIDE
      ===================================================== */}

      <path
        d="
          M600 220
          L890 220
          L630 780
          L370 780
          L500 515
          Z
        "
        fill="url(#vellura-cyan-edge)"
      />

      <path
        d="
          M603 227
          L880 227
          L630 770
          L500 515
          Z
        "
        fill="url(#vellura-cyan-main)"
      />

      {/* Faceta superior */}
      <path
        d="
          M603 227
          L880 227
          L500 515
          Z
        "
        fill="url(#vellura-cyan-light)"
      />

      {/* Faceta exterior oscura */}
      <path
        d="
          M880 227
          L630 770
          L500 515
          Z
        "
        fill="url(#vellura-cyan-shadow)"
      />

      {/* Faceta inferior */}
      <path
        d="
          M500 515
          L630 770
          L565 640
          Z
        "
        fill="#1D8FE0"
        fillOpacity="0.18"
      />

      {/* Líneas de cristal */}
      <path
        d="M603 227L500 515L630 770"
        stroke="#9BFAFF"
        strokeOpacity="0.38"
        strokeWidth="3"
      />

      <path
        d="M880 227L500 515L630 770"
        stroke="#B6F9FF"
        strokeOpacity="0.22"
        strokeWidth="3"
      />

      {/* =====================================================
    CENTER CRYSTAL
===================================================== */}

      {/* Halo muy suave detrás del cristal */}
      <ellipse
        cx="500"
        cy="555"
        rx="90"
        ry="78"
        fill="url(#vellura-center-glow)"
        opacity="0.55"
        filter="url(#vellura-glow)"
      />

      {/* Triángulo central translúcido */}
      <path
        d="
    M500 515
    L370 770
    L630 770
    Z
  "
        fill="url(#vellura-center)"
        fillOpacity="0.48"
      />

      {/* Faceta central */}
      <path
        d="
    M500 515
    L555 625
    L630 770
    L500 700
    L370 770
    L445 625
    Z
  "
        fill="url(#vellura-center)"
        fillOpacity="0.62"
      />

      {/* Reflexión diagonal principal */}
      <path
        d="
    M435 535
    L500 515
    L585 675
    L548 640
    Z
  "
        fill="url(#vellura-highlight)"
      />

      {/* Pequeña zona de luz en la intersección */}
      <ellipse
        cx="500"
        cy="550"
        rx="34"
        ry="45"
        fill="url(#vellura-center-glow)"
        opacity="0.58"
        filter="url(#vellura-soft-glow)"
      />

      {/* Reflejo blanco fino */}
      <path
        d="
    M500 515
    L520 565
    L630 770
    L540 635
    Z
  "
        fill="#FFFFFF"
        fillOpacity="0.26"
      />

      {/* Líneas estructurales del cristal */}
      <path
        d="M500 515L370 770L500 700L630 770L500 515Z"
        stroke="#FFFFFF"
        strokeOpacity="0.20"
        strokeWidth="3"
      />

      {/* Línea inferior de cristal */}
      <path
        d="M370 780L630 780"
        stroke="#D9E8FF"
        strokeOpacity="0.65"
        strokeWidth="4"
      />

      {/* =====================================================
          BORDES
      ===================================================== */}

      <path d="M110 220L400 220" stroke="#8D61E8" strokeWidth="6" />

      <path d="M600 220L890 220" stroke="#5DECF0" strokeWidth="6" />

      <path
        d="M110 220L370 780"
        stroke="#6B42D1"
        strokeWidth="5"
        strokeOpacity="0.75"
      />

      <path
        d="M890 220L630 780"
        stroke="#43D9F0"
        strokeWidth="5"
        strokeOpacity="0.75"
      />

      <path
        d="M370 780L630 780"
        stroke="#D9E8FF"
        strokeOpacity="0.7"
        strokeWidth="5"
      />
    </svg>
  );
}
