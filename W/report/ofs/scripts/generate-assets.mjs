/**
 * Generates all brand assets for the site:
 *   public/favicon.svg, favicon-16.png, favicon-32.png
 *   public/apple-touch-icon.png
 *   public/icons/icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png
 *   public/og.png (1200x630 social card)
 *   src/assets/logo.svg (header/sidebar mark)
 *
 * Run with:  bun run assets
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);
const src = (p) => resolve(root, 'src', p);

/* ------------------------------------------------------------------ *
 * Brand palette (synthwave / bluish-green)
 * ------------------------------------------------------------------ */
const C = {
  ink: '#04121b',
  ink2: '#071f22',
  mint: '#5cffd0',
  teal: '#19d3d8',
  cyan: '#2b8cff',
  white: '#eafffb',
};

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.ink}"/>
      <stop offset="1" stop-color="${C.ink2}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.mint}"/>
      <stop offset=".55" stop-color="${C.teal}"/>
      <stop offset="1" stop-color="${C.cyan}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".42" r=".62">
      <stop offset="0" stop-color="${C.teal}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${C.teal}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/** Shield + neural-triangle glyph. `inset` (0–0.25) keeps a maskable-safe margin. */
function glyph(inset = 0) {
  const shrink = (v) => Math.round((256 + (v - 256) * (1 - inset)) * 100) / 100;
  const node = [
    [shrink(256), shrink(196)],
    [shrink(196), shrink(292)],
    [shrink(316), shrink(292)],
  ];
  const link = (a, b) =>
    `      <path d="M${node[a][0]} ${node[a][1]} L${node[b][0]} ${node[b][1]}"/>`;
  const dots = node
    .map(([x, y]) => `      <circle cx="${x}" cy="${y}" r="${24 * (1 - inset)}"/>`)
    .join('\n');
  const shield = `M${shrink(256)} ${shrink(96)} L${shrink(384)} ${shrink(148)} V${shrink(252)} C${shrink(384)} ${shrink(336)} ${shrink(328)} ${shrink(392)} ${shrink(256)} ${shrink(420)} C${shrink(184)} ${shrink(392)} ${shrink(128)} ${shrink(336)} ${shrink(128)} ${shrink(252)} V${shrink(148)} Z`;
  return `
  <g>
    <circle cx="256" cy="240" r="190" fill="url(#glow)"/>
    <path d="${shield}" fill="url(#accent)" opacity=".16"/>
    <path d="${shield}" fill="none" stroke="url(#accent)" stroke-width="12" stroke-linejoin="round"/>
    <g fill="url(#accent)">
${dots}
    </g>
    <g stroke="${C.white}" stroke-opacity=".85" stroke-width="9" stroke-linecap="round">
${link(0, 1)}
${link(0, 2)}
${link(1, 2)}
    </g>
    <g stroke="url(#accent)" stroke-opacity=".3" stroke-width="3">
      <path d="M${shrink(40)} ${shrink(460)} H${shrink(472)}"/>
      <path d="M${shrink(72)} ${shrink(494)} H${shrink(440)}"/>
    </g>
  </g>`;
}

/** App icon (square, opaque). */
function iconSvg(inset = 0) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
${defs}
  <rect width="512" height="512" rx="${inset ? 0 : 108}" fill="url(#bg)"/>
  <rect x="16" y="16" width="480" height="480" rx="${inset ? 24 : 96}" fill="none"
        stroke="url(#accent)" stroke-opacity=".5" stroke-width="3"/>
${glyph(inset)}
</svg>`;
}

/** Compact favicon (no heavy glow, crisp at 16px). */
function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
${defs}
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M256 92 L392 148 V256 C392 344 332 404 256 432 C180 404 120 344 120 256 V148 Z"
        fill="url(#accent)" opacity=".22"/>
  <path d="M256 92 L392 148 V256 C392 344 332 404 256 432 C180 404 120 344 120 256 V148 Z"
        fill="none" stroke="url(#accent)" stroke-width="26" stroke-linejoin="round"/>
  <g fill="url(#accent)">
    <circle cx="256" cy="196" r="30"/>
    <circle cx="198" cy="296" r="30"/>
    <circle cx="314" cy="296" r="30"/>
  </g>
  <g stroke="${C.white}" stroke-width="14" stroke-linecap="round">
    <path d="M256 196 L198 296 M256 196 L314 296 M198 296 L314 296"/>
  </g>
</svg>`;
}

/** Horizontal mark for the docs header. */
function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
${defs}
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <path d="M32 11 L49 19 V32 C49 43 41 50 32 54 C23 50 15 43 15 32 V19 Z"
        fill="url(#accent)" opacity=".2"/>
  <path d="M32 11 L49 19 V32 C49 43 41 50 32 54 C23 50 15 43 15 32 V19 Z"
        fill="none" stroke="url(#accent)" stroke-width="3.4" stroke-linejoin="round"/>
  <g fill="url(#accent)">
    <circle cx="32" cy="25" r="3.6"/>
    <circle cx="24" cy="38" r="3.6"/>
    <circle cx="40" cy="38" r="3.6"/>
  </g>
  <g stroke="${C.white}" stroke-width="1.9" stroke-linecap="round">
    <path d="M32 25 L24 38 M32 25 L40 38 M24 38 L40 38"/>
  </g>
</svg>`;
}

/** 1200x630 social card. */
function ogSvg() {
  const vlines = Array.from({ length: 15 }, (_, i) => {
    const x = 40 + i * 80;
    return `<path d="M${x} 440 V630"/>`;
  }).join('\n      ');
  const hlines = [470, 505, 545, 590, 630]
    .map((y) => `<path d="M0 ${y} H1200"/>`)
    .join('\n      ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
${defs}
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect y="380" width="1200" height="250" fill="url(#glow)" opacity=".7"/>
  <g stroke="url(#accent)" stroke-opacity=".28" stroke-width="2">
      ${vlines}
  </g>
  <g stroke="url(#accent)" stroke-opacity=".4" stroke-width="2">
      ${hlines}
  </g>
  <path d="M0 380 H1200" stroke="url(#accent)" stroke-width="4" stroke-opacity=".9"/>
  <rect x="24" y="24" width="1152" height="582" rx="18" fill="none"
        stroke="url(#accent)" stroke-opacity=".35" stroke-width="3"/>
  <g transform="translate(72, 96) scale(.62)">
${glyph(0.06)}
  </g>
  <g font-family="DejaVu Sans, Verdana, sans-serif" fill="${C.white}">
    <text x="410" y="196" font-size="66" font-weight="bold" letter-spacing="2"
          fill="url(#accent)">AI SECURITY</text>
    <text x="410" y="272" font-size="66" font-weight="bold" letter-spacing="2">SENTINEL</text>
    <text x="410" y="330" font-size="27" fill="#9fe8dd" opacity=".95">Defensive &amp; offensive AI security field manual</text>
    <text x="410" y="470" font-size="25" fill="#7fe6d4" opacity=".9">Part I — Top 10 AI Security Vulnerabilities (OWASP LLM Top 10)</text>
    <text x="410" y="512" font-size="25" fill="#7fe6d4" opacity=".9">Part II — Offensive &amp; Adversarial AI Models for Authorized Red-Teaming</text>
  </g>
  <g font-family="DejaVu Sans, Verdana, sans-serif" font-size="22" fill="#5cffd0" opacity=".85">
    <text x="72" y="590">Authorized security testing only · 2026</text>
  </g>
</svg>`;
}

async function out(relPath, buffer) {
  const target = pub(relPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
  console.log('  ✓', `public/${relPath}`);
}

async function main() {
  console.log('Generating assets…');

  const favicon = faviconSvg();
  await out('favicon.svg', favicon);
  await out('favicon-16.png', await sharp(Buffer.from(favicon)).resize(16).png().toBuffer());
  await out('favicon-32.png', await sharp(Buffer.from(favicon)).resize(32).png().toBuffer());
  await out('favicon-96.png', await sharp(Buffer.from(favicon)).resize(96).png().toBuffer());

  const icon = iconSvg(0);
  await out('apple-touch-icon.png', await sharp(Buffer.from(icon)).resize(180).png().toBuffer());
  await out('icons/icon-192.png', await sharp(Buffer.from(icon)).resize(192).png().toBuffer());
  await out('icons/icon-512.png', await sharp(Buffer.from(icon)).resize(512).png().toBuffer());
  await out('icons/icon-96.png', await sharp(Buffer.from(icon)).resize(96).png().toBuffer());

  // Maskable icons must be full-bleed and opaque — no transparency, safe centre.
  const maskable = iconSvg(0.22);
  await out(
    'icons/icon-maskable-192.png',
    await sharp(Buffer.from(maskable)).resize(192).flatten({ background: C.ink }).png().toBuffer()
  );
  await out(
    'icons/icon-maskable-512.png',
    await sharp(Buffer.from(maskable)).resize(512).flatten({ background: C.ink }).png().toBuffer()
  );

  await out('og.png', await sharp(Buffer.from(ogSvg())).png().toBuffer());

  await mkdir(src('assets'), { recursive: true });
  await writeFile(src('assets/logo.svg'), logoSvg());
  console.log('  ✓', 'src/assets/logo.svg');

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
