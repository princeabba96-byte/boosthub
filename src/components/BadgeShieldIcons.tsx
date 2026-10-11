import React from 'react';

interface ShieldProps {
  className?: string;
  size?: number;
  locked?: boolean;
}

/**
 * 1. FIRERING EDITOR - LEVEL 1 (Bronze Shield with Checkmark & Oak Wreath)
 */
export const BronzeShieldFireringEditor: React.FC<ShieldProps> = ({
  className = '',
  size = 64,
  locked = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'grayscale opacity-60' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="bronzeBorder" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C48043" />
        <stop offset="35%" stopColor="#8A4819" />
        <stop offset="70%" stopColor="#5C2D0E" />
        <stop offset="100%" stopColor="#3B1C08" />
      </linearGradient>
      <linearGradient id="bronzeBody" x1="100" y1="20" x2="100" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8D4C1F" />
        <stop offset="50%" stopColor="#673412" />
        <stop offset="100%" stopColor="#44210A" />
      </linearGradient>
      <radialGradient id="bronzeMedal" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D99B5E" />
        <stop offset="70%" stopColor="#8F4B1E" />
        <stop offset="100%" stopColor="#4D250E" />
      </radialGradient>
      <filter id="bronzeGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#B45309" floodOpacity="0.4" />
      </filter>
    </defs>

    <g filter="url(#bronzeGlow)">
      {/* Outer Shield Rim */}
      <path
        d="M100 12 C135 12 175 22 188 38 C188 120 162 185 100 228 C38 185 12 120 12 38 C25 22 65 12 100 12 Z"
        fill="url(#bronzeBorder)"
        stroke="#451A03"
        strokeWidth="4"
      />
      {/* Inner Shield Body */}
      <path
        d="M100 24 C130 24 163 32 174 46 C174 116 152 172 100 212 C48 172 26 116 26 46 C37 32 70 24 100 24 Z"
        fill="url(#bronzeBody)"
        stroke="#D97706"
        strokeWidth="2"
      />

      {/* Rivet Studs */}
      <circle cx="34" cy="46" r="3" fill="#D97706" />
      <circle cx="166" cy="46" r="3" fill="#D97706" />
      <circle cx="100" cy="28" r="3" fill="#D97706" />
      <circle cx="100" cy="204" r="3" fill="#D97706" />

      {/* Scroll Banner Upper Arc */}
      <path
        d="M32 82 Q100 68 168 82 L164 108 Q100 94 36 108 Z"
        fill="#261205"
        stroke="#B45309"
        strokeWidth="2"
      />
      <text
        x="100"
        y="93"
        textAnchor="middle"
        fill="#FDE68A"
        fontSize="12"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        FIRERING
      </text>
      <text
        x="100"
        y="105"
        textAnchor="middle"
        fill="#FDE68A"
        fontSize="10"
        fontWeight="800"
        letterSpacing="0.8"
        fontFamily="sans-serif"
      >
        EDITOR
      </text>

      {/* Level Subtitle */}
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fill="#F59E0B"
        fontSize="11"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        LEVEL 1
      </text>

      {/* Center Bronze Checkmark Medallion */}
      <circle cx="100" cy="156" r="22" fill="url(#bronzeMedal)" stroke="#F59E0B" strokeWidth="2.5" />
      <path
        d="M91 156 L97 162 L110 149"
        stroke="#FEF3C7"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Laurel Wreath Base */}
      <path
        d="M66 182 C72 194 84 202 100 204 C116 202 128 194 134 182"
        stroke="#D97706"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="68" cy="184" r="3.5" fill="#D97706" />
      <circle cx="78" cy="192" r="3.5" fill="#D97706" />
      <circle cx="90" cy="198" r="3.5" fill="#D97706" />
      <circle cx="110" cy="198" r="3.5" fill="#D97706" />
      <circle cx="122" cy="192" r="3.5" fill="#D97706" />
      <circle cx="132" cy="184" r="3.5" fill="#D97706" />
    </g>
  </svg>
);

/**
 * 2. ENGAGEMENT MASTER - LEVEL 2 (Polished Silver Shield with 3D Heart)
 */
export const SilverShieldEngagementMaster: React.FC<ShieldProps> = ({
  className = '',
  size = 64,
  locked = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'grayscale opacity-60' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="silverBorder" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="25%" stopColor="#CBD5E1" />
        <stop offset="50%" stopColor="#64748B" />
        <stop offset="75%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="silverBody" x1="100" y1="20" x2="100" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="45%" stopColor="#64748B" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="silverHeart" x1="80" y1="135" x2="120" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#E2E8F0" />
        <stop offset="80%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <filter id="silverGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#38BDF8" floodOpacity="0.4" />
      </filter>
    </defs>

    <g filter="url(#silverGlow)">
      {/* Outer Shield Rim */}
      <path
        d="M100 12 C135 12 175 22 188 38 C188 120 162 185 100 228 C38 185 12 120 12 38 C25 22 65 12 100 12 Z"
        fill="url(#silverBorder)"
        stroke="#1E293B"
        strokeWidth="4"
      />
      {/* Inner Shield Body */}
      <path
        d="M100 24 C130 24 163 32 174 46 C174 116 152 172 100 212 C48 172 26 116 26 46 C37 32 70 24 100 24 Z"
        fill="url(#silverBody)"
        stroke="#E2E8F0"
        strokeWidth="2"
      />

      {/* Rivet Studs */}
      <circle cx="34" cy="46" r="3" fill="#F8FAFC" />
      <circle cx="166" cy="46" r="3" fill="#F8FAFC" />
      <circle cx="100" cy="28" r="3" fill="#F8FAFC" />
      <circle cx="100" cy="204" r="3" fill="#F8FAFC" />

      {/* Banner */}
      <path
        d="M30 82 Q100 68 170 82 L166 108 Q100 94 34 108 Z"
        fill="#0F172A"
        stroke="#94A3B8"
        strokeWidth="2"
      />
      <text
        x="100"
        y="93"
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize="11"
        fontWeight="900"
        letterSpacing="0.8"
        fontFamily="sans-serif"
      >
        ENGAGEMENT
      </text>
      <text
        x="100"
        y="105"
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize="11"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        MASTER
      </text>

      {/* Level Subtitle */}
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fill="#E2E8F0"
        fontSize="11"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        LEVEL 2
      </text>

      {/* 3D Embossed Silver Heart */}
      <path
        d="M100 174 C100 174 76 158 76 145 C76 137 82 131 90 131 C95 131 98 134 100 137 C102 134 105 131 110 131 C118 131 124 137 124 145 C124 158 100 174 100 174 Z"
        fill="url(#silverHeart)"
        stroke="#FFFFFF"
        strokeWidth="2.5"
      />

      {/* Laurel Leaves */}
      <path
        d="M64 184 C72 196 84 204 100 206 C116 204 128 196 136 184"
        stroke="#CBD5E1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
);

/**
 * 3. CONTENT GOD - LEVEL 3 (24K Royal Gold Shield with Roaring Flame)
 */
export const GoldShieldContentGod: React.FC<ShieldProps> = ({
  className = '',
  size = 64,
  locked = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'grayscale opacity-60' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="goldBorder" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="30%" stopColor="#F59E0B" />
        <stop offset="60%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="goldBody" x1="100" y1="20" x2="100" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="45%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="flameGrad" x1="100" y1="130" x2="100" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#F59E0B" floodOpacity="0.55" />
      </filter>
    </defs>

    <g filter="url(#goldGlow)">
      {/* Outer Golden Shield Rim */}
      <path
        d="M100 12 C135 12 175 22 188 38 C188 120 162 185 100 228 C38 185 12 120 12 38 C25 22 65 12 100 12 Z"
        fill="url(#goldBorder)"
        stroke="#451A03"
        strokeWidth="4"
      />
      {/* Inner Shield Body */}
      <path
        d="M100 24 C130 24 163 32 174 46 C174 116 152 172 100 212 C48 172 26 116 26 46 C37 32 70 24 100 24 Z"
        fill="url(#goldBody)"
        stroke="#FDE68A"
        strokeWidth="2.5"
      />

      {/* Rivet Studs */}
      <circle cx="34" cy="46" r="3.5" fill="#FEF3C7" />
      <circle cx="166" cy="46" r="3.5" fill="#FEF3C7" />
      <circle cx="100" cy="28" r="3.5" fill="#FEF3C7" />
      <circle cx="100" cy="204" r="3.5" fill="#FEF3C7" />

      {/* Banner */}
      <path
        d="M32 82 Q100 68 168 82 L164 108 Q100 94 36 108 Z"
        fill="#2A1608"
        stroke="#FBBF24"
        strokeWidth="2"
      />
      <text
        x="100"
        y="93"
        textAnchor="middle"
        fill="#FEF3C7"
        fontSize="12"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        CONTENT
      </text>
      <text
        x="100"
        y="105"
        textAnchor="middle"
        fill="#FEF3C7"
        fontSize="12"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        GOD
      </text>

      {/* Level Subtitle */}
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fill="#FDE68A"
        fontSize="11"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        LEVEL 3
      </text>

      {/* Center Roaring Flame */}
      <path
        d="M100 134 C94 144 88 152 92 162 C94 166 98 172 104 172 C114 172 118 162 114 154 C112 150 108 147 106 142 C104 138 102 135 100 134 Z"
        fill="url(#flameGrad)"
        stroke="#FEF08A"
        strokeWidth="1.5"
      />

      {/* Golden Wreath Wrapping Base */}
      <path
        d="M60 180 C70 196 84 206 100 208 C116 206 130 196 140 180"
        stroke="#FDE68A"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="64" cy="184" r="3.5" fill="#FDE68A" />
      <circle cx="76" cy="194" r="3.5" fill="#FDE68A" />
      <circle cx="90" cy="202" r="3.5" fill="#FDE68A" />
      <circle cx="110" cy="202" r="3.5" fill="#FDE68A" />
      <circle cx="124" cy="194" r="3.5" fill="#FDE68A" />
      <circle cx="136" cy="184" r="3.5" fill="#FDE68A" />
    </g>
  </svg>
);

/**
 * 4. DISTANT WINNER - LEVEL 4 (Ice Crystal Diamond Shield with Silver Trophy)
 */
export const CrystalShieldDistantWinner: React.FC<ShieldProps> = ({
  className = '',
  size = 64,
  locked = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'grayscale opacity-60' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="crystalBorder" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="35%" stopColor="#38BDF8" />
        <stop offset="70%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0C4A6E" />
      </linearGradient>
      <linearGradient id="crystalBody" x1="100" y1="20" x2="100" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0369A1" />
        <stop offset="100%" stopColor="#082F49" />
      </linearGradient>
      <linearGradient id="trophyGrad" x1="100" y1="130" x2="100" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#E0F2FE" />
        <stop offset="80%" stopColor="#7DD3FC" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <filter id="crystalGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#38BDF8" floodOpacity="0.6" />
      </filter>
    </defs>

    <g filter="url(#crystalGlow)">
      {/* Outer Jagged Crystal Spikes */}
      <path
        d="M100 6 L124 20 L158 14 L170 32 L192 48 L182 110 L168 180 L100 236 L32 180 L18 110 L8 48 L30 32 L42 14 L76 20 Z"
        fill="#082F49"
        stroke="#38BDF8"
        strokeWidth="3"
      />
      {/* Main Crystal Shield Body */}
      <path
        d="M100 18 C135 18 168 28 178 44 C178 116 156 172 100 214 C44 172 22 116 22 44 C32 28 65 18 100 18 Z"
        fill="url(#crystalBody)"
        stroke="url(#crystalBorder)"
        strokeWidth="3.5"
      />

      {/* Crystal Diamond Facet Lines */}
      <path d="M100 18 L100 214" stroke="#7DD3FC" strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M22 44 L100 100 L178 44" stroke="#7DD3FC" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Banner */}
      <path
        d="M32 78 Q100 66 168 78 L164 104 Q100 90 36 104 Z"
        fill="#041F33"
        stroke="#38BDF8"
        strokeWidth="2"
      />
      <text
        x="100"
        y="89"
        textAnchor="middle"
        fill="#F0F9FF"
        fontSize="11"
        fontWeight="900"
        letterSpacing="0.8"
        fontFamily="sans-serif"
      >
        DISTANT
      </text>
      <text
        x="100"
        y="101"
        textAnchor="middle"
        fill="#F0F9FF"
        fontSize="11"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        WINNER
      </text>

      {/* Level Subtitle */}
      <text
        x="100"
        y="122"
        textAnchor="middle"
        fill="#BAE6FD"
        fontSize="11"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        LEVEL 4
      </text>

      {/* Silver Ice Championship Trophy Cup */}
      <path
        d="M84 135 H116 L112 152 C112 158 108 164 100 164 C92 164 88 158 88 152 Z"
        fill="url(#trophyGrad)"
        stroke="#E0F2FE"
        strokeWidth="2"
      />
      {/* Trophy Handles */}
      <path d="M84 138 C76 138 76 148 85 149" stroke="#E0F2FE" strokeWidth="2" fill="none" />
      <path d="M116 138 C124 138 124 148 115 149" stroke="#E0F2FE" strokeWidth="2" fill="none" />
      {/* Trophy Stem & Base */}
      <path d="M98 164 V170 H92 V174 H108 V170 H102 V164" fill="#E0F2FE" />
      {/* Accompanying Stars */}
      <path d="M74 162 L76 166 L80 166 L77 169 L78 173 L74 170 L70 173 L71 169 L68 166 L72 166 Z" fill="#BAE6FD" />
      <path d="M126 162 L128 166 L132 166 L129 169 L130 173 L126 170 L122 173 L123 169 L120 166 L124 166 Z" fill="#BAE6FD" />
    </g>
  </svg>
);

/**
 * 5. BOOST PRO - LEVEL 5 (HEROIC GRANDMASTER)
 * (Epic Flaming Winged Crest with Royal Crown, Diamond Embers & Ruby Plate)
 */
export const HeroicGrandmasterBoostPro: React.FC<ShieldProps> = ({
  className = '',
  size = 64,
  locked = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'grayscale opacity-60' : 'hover:scale-105 animate-pulse'} ${className}`}
  >
    <defs>
      <linearGradient id="fireWingGrad" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="25%" stopColor="#F97316" />
        <stop offset="60%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
      <linearGradient id="rubyShield" x1="120" y1="50" x2="120" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="50%" stopColor="#991B1B" />
        <stop offset="100%" stopColor="#450A0A" />
      </linearGradient>
      <linearGradient id="crownGold" x1="100" y1="10" x2="140" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <filter id="grandmasterGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#EF4444" floodOpacity="0.75" />
        <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F59E0B" floodOpacity="0.5" />
      </filter>
    </defs>

    <g filter="url(#grandmasterGlow)">
      {/* Outstretched Left Phoenix Fire Wings */}
      <g>
        <path d="M72 130 C40 110 18 90 12 70 C24 88 40 102 70 112 Z" fill="url(#fireWingGrad)" />
        <path d="M72 142 C30 126 14 108 8 92 C20 108 38 122 68 132 Z" fill="url(#fireWingGrad)" />
        <path d="M70 156 C32 148 16 132 12 120 C22 134 38 146 66 150 Z" fill="url(#fireWingGrad)" />
        <path d="M74 170 C44 172 26 160 20 148 C30 160 46 168 70 168 Z" fill="url(#fireWingGrad)" />
      </g>

      {/* Outstretched Right Phoenix Fire Wings */}
      <g>
        <path d="M168 130 C200 110 222 90 228 70 C216 88 200 102 170 112 Z" fill="url(#fireWingGrad)" />
        <path d="M168 142 C210 126 226 108 232 92 C220 108 202 122 172 132 Z" fill="url(#fireWingGrad)" />
        <path d="M170 156 C208 148 224 132 228 120 C218 134 202 146 174 150 Z" fill="url(#fireWingGrad)" />
        <path d="M166 170 C196 172 214 160 220 148 C210 160 194 168 170 168 Z" fill="url(#fireWingGrad)" />
      </g>

      {/* Royal Fiery Crown Crest on Top */}
      <path
        d="M92 46 L98 22 L110 36 L120 14 L130 36 L142 22 L148 46 Z"
        fill="url(#crownGold)"
        stroke="#FEF08A"
        strokeWidth="2"
      />
      {/* Crown Jewels */}
      <circle cx="120" cy="22" r="3.5" fill="#FEF08A" />
      <circle cx="98" cy="28" r="2.5" fill="#EF4444" />
      <circle cx="142" cy="28" r="2.5" fill="#EF4444" />

      {/* Main Ruby Shield */}
      <path
        d="M120 44 C152 44 178 52 188 66 C188 134 166 186 120 222 C74 186 52 134 52 66 C62 52 88 44 120 44 Z"
        fill="url(#rubyShield)"
        stroke="#FEF08A"
        strokeWidth="3.5"
      />
      {/* Gold Inner Bevel */}
      <path
        d="M120 54 C146 54 168 62 176 74 C176 130 156 174 120 206 C84 174 64 130 64 74 C72 62 94 54 120 54 Z"
        stroke="#F59E0B"
        strokeWidth="2"
        fill="none"
      />

      {/* Banner */}
      <path
        d="M66 94 Q120 82 174 94 L170 118 Q120 106 70 118 Z"
        fill="#260404"
        stroke="#F59E0B"
        strokeWidth="2"
      />
      <text
        x="120"
        y="108"
        textAnchor="middle"
        fill="#FEF08A"
        fontSize="13"
        fontWeight="900"
        letterSpacing="1"
        fontFamily="sans-serif"
      >
        BOOST PRO
      </text>

      {/* Level Subtitle */}
      <text
        x="120"
        y="134"
        textAnchor="middle"
        fill="#FDE047"
        fontSize="12"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        LEVEL 5
      </text>
      <text
        x="120"
        y="148"
        textAnchor="middle"
        fill="#FCA5A5"
        fontSize="8"
        fontWeight="800"
        letterSpacing="0.5"
        fontFamily="sans-serif"
      >
        HEROIC GRANDMASTER
      </text>

      {/* Glowing Diamond Star Core */}
      <path
        d="M120 162 L126 174 L138 180 L126 186 L120 198 L114 186 L102 180 L114 174 Z"
        fill="#FFFFFF"
        stroke="#FEF08A"
        strokeWidth="2"
      />
      <circle cx="120" cy="180" r="3" fill="#F59E0B" />
    </g>
  </svg>
);

/**
 * 6. ROOKIE FLAME SKULL (Image 1 milestone LV.1)
 */
export const RookieFlameSkullIcon: React.FC<ShieldProps> = ({
  className = '',
  size = 56,
  locked = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'grayscale opacity-60' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="diamondBg" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="50%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
    </defs>
    {/* Diamond Plate Base */}
    <rect x="50" y="8" width="58" height="58" rx="8" transform="rotate(45 50 8)" fill="url(#diamondBg)" stroke="#FEF08A" strokeWidth="2.5" />
    {/* Skull Icon with Flames */}
    <path
      d="M50 32 C41 32 34 38 34 47 C34 52 36 57 40 60 V66 H60 V60 C64 57 66 52 66 47 C66 38 59 32 50 32 Z"
      fill="#FEF08A"
    />
    <circle cx="43" cy="46" r="3.5" fill="#7C2D12" />
    <circle cx="57" cy="46" r="3.5" fill="#7C2D12" />
    <path d="M50 51 L48 56 H52 Z" fill="#7C2D12" />
    <path d="M44 63 V66 M48 63 V66 M52 63 V66 M56 63 V66" stroke="#7C2D12" strokeWidth="1.5" />
  </svg>
);

/**
 * 7. MASTER PADLOCK MILESTONE (Image 1 milestone LV.6 Master Locked)
 */
export const MasterPadlockIcon: React.FC<ShieldProps> = ({
  className = '',
  size = 56,
  locked = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${locked ? 'opacity-80' : 'animate-bounce'} ${className}`}
  >
    <rect x="50" y="8" width="58" height="58" rx="8" transform="rotate(45 50 8)" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
    {/* Padlock Body */}
    <rect x="38" y="46" width="24" height="20" rx="3" fill="#94A3B8" />
    {/* Padlock Shackle */}
    <path d="M42 46 V38 C42 33 46 30 50 30 C54 30 58 33 58 38 V46" stroke="#CBD5E1" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="50" cy="54" r="2" fill="#0F172A" />
    <path d="M50 56 V61" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
