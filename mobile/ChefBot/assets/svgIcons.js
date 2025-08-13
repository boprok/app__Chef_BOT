// Chef Bot SVG Icons and Logos

// Your Chef Bot logo SVG - Compact version without background
export const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36" role="img" aria-label="Chef Bot logo">
  <!-- Chef Hat -->
  <g transform="translate(6,2)">
    <!-- Puffy top (three circles with better blending) -->
    <circle cx="10" cy="8" r="4" fill="#f7f9f8"/>
    <circle cx="18" cy="6" r="5" fill="#f7f9f8"/>
    <circle cx="26" cy="8" r="4" fill="#f7f9f8"/>
    <!-- Hat band with smoother corners -->
    <rect x="8" y="10" width="20" height="6" rx="3" fill="#e06d06"/>
    <!-- Subtle hat shadow -->
    <ellipse cx="18" cy="17" rx="12" ry="1.5" fill="#000" opacity="0.1"/>
  </g>

  <!-- Robot Head -->
  <g transform="translate(6,18)">
    <!-- Head shape with smoother corners -->
    <rect x="0" y="0" width="36" height="18" rx="8" fill="#2ba84a"/>
    <!-- Eyes with subtle glow -->
    <circle cx="12" cy="8" r="3" fill="#f7f9f8" opacity="0.9"/>
    <circle cx="24" cy="8" r="3" fill="#f7f9f8" opacity="0.9"/>
    <circle cx="12" cy="8" r="2" fill="#000000"/>
    <circle cx="24" cy="8" r="2" fill="#000000"/>
    <!-- Eye highlights -->
    <circle cx="12.5" cy="7.5" r="0.6" fill="#ffffff" opacity="0.8"/>
    <circle cx="24.5" cy="7.5" r="0.6" fill="#ffffff" opacity="0.8"/>
    <!-- Mouth with rounded ends -->
    <rect x="14" y="12" width="8" height="2" rx="1" fill="#b26700"/>
    <!-- Accent bolts with glow -->
    <circle cx="3" cy="9" r="1.5" fill="#ffc53a" opacity="0.9"/>
    <circle cx="33" cy="9" r="1.5" fill="#ffc53a" opacity="0.9"/>
    <circle cx="3" cy="9" r="0.8" fill="#ffd700"/>
    <circle cx="33" cy="9" r="0.8" fill="#ffd700"/>
  </g>
</svg>
`;

// PRO Badge Logo SVG
export const proBadgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20" width="32" height="20">
  <defs>
    <linearGradient id="proGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffc53a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e06d06;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="20" rx="10" fill="url(#proGradient)"/>
  <text x="16" y="14" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="10" font-weight="bold">PRO</text>
  <circle cx="6" cy="10" r="2" fill="#ffffff" opacity="0.8"/>
</svg>
`;

// Upgrade to Pro Icon SVG
export const upgradeIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
  <defs>
    <linearGradient id="upgradeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffaa00;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Crown shape with white outline for contrast -->
  <path d="M6 18L9 12L14 16L19 12L22 18H6Z" fill="url(#upgradeGradient)" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Crown jewels with better contrast -->
  <circle cx="9" cy="14" r="1.4" fill="#ffffff" stroke="#333333" stroke-width="0.6"/>
  <circle cx="14" cy="12" r="1.4" fill="#ffffff" stroke="#333333" stroke-width="0.6"/>
  <circle cx="19" cy="14" r="1.4" fill="#ffffff" stroke="#333333" stroke-width="0.6"/>
  <!-- Crown base with white outline -->
  <rect x="6" y="18" width="16" height="3.5" rx="1.2" fill="url(#upgradeGradient)" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Enhanced sparkle effects -->
  <circle cx="7" cy="9" r="1" fill="#ffffff" stroke="#ffd700" stroke-width="0.6"/>
  <circle cx="21" cy="10" r="1" fill="#ffffff" stroke="#ffd700" stroke-width="0.6"/>
  <circle cx="4" cy="15" r="0.8" fill="#ffffff" stroke="#ffd700" stroke-width="0.6"/>
  <circle cx="24" cy="15" r="0.8" fill="#ffffff" stroke="#ffd700" stroke-width="0.6"/>
</svg>
`;
