// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import cloudflare from '@astrojs/cloudflare';
import { satteri } from '@astrojs/markdown-satteri';

import { externalLinksNewTab } from './plugins/external-links.mjs';

/**
 * Placeholder canonical origin. Set this to the real deployment URL before
 * publishing — it is used for canonical links and absolute Open Graph URLs.
 */
const SITE = 'https://ai-security-sentinel.pages.dev';

/**
 * True when the CLI was invoked as `astro dev` (e.g. `astro dev`, `astro dev --background`,
 * `astro --verbose dev`). Anything else — build, preview, sync, or programmatic use — keeps
 * the adapter attached.
 */
function isDevCommand() {
  const args = process.argv.slice(2);
  return args.find((arg) => !arg.startsWith('-')) === 'dev';
}

// https://astro.build/config
export default defineConfig({
  site: SITE,

  /**
   * Sätteri is Astro 7's default Markdown processor; naming it here only to add the one plugin that
   * sends every off-site URL (vendor docs, OWASP/NIST/MITRE frameworks, press) to a new tab, so a
   * tap never navigates away from the manual. The defaults are unchanged, and the plugin lives in
   * ./plugins/external-links.mjs.
   */
  markdown: {
    processor: satteri({
      hastPlugins: [externalLinksNewTab],
    }),
  },

  integrations: [
    starlight({
      title: 'AI Security Sentinel',
      description:
        'Synthwave field manual for AI security: the OWASP LLM Top 10 vulnerabilities facing AI systems and offensive/adversarial AI models for authorized red-teaming.',
      titleDelimiter: '·',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'AI Security Sentinel',
      },
      favicon: '/favicon.svg',
      credits: false,
      // Sidebar is numbered: each entry maps to a numbered section of the source reports.
      sidebar: [
        {
          label: 'Part I · AI Vulnerabilities',
          items: [{ autogenerate: { directory: 'part-1-ai-security-vulnerabilities' } }],
        },
        {
          label: 'Part II · Offensive AI Models',
          items: [{ autogenerate: { directory: 'part-2-offensive-ai-models' } }],
        },
        {
          label: 'Part III · Top 20 Vulnerabilities',
          items: [{ autogenerate: { directory: 'part-3-top-20-ai-security-vulnerabilities' } }],
        },
      ],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      // Adds the numbered "Contents" list that stands in for the TOC column below 72rem,
      // where Starlight otherwise hides the list behind a collapsed bar. See the component.
      components: { PageTitle: './src/components/PageTitle.astro' },
      // Variable fonts, self-hosted so the PWA works offline.
      customCss: [
        '@fontsource-variable/inter',
        '@fontsource-variable/space-grotesk',
        '@fontsource-variable/jetbrains-mono',
        './src/custom.css',
      ],
      // A dark + light pair, as Starlight requires for its theme switch to stay in sync.
      expressiveCode: {
        themes: ['synthwave-84', 'github-light'],
        useStarlightUiThemeColors: true,
      },
      head: [
        // --- PWA -----------------------------------------------------------
        {
          tag: 'link',
          attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#000000', /* AMOLED: the OS chrome blends into a true-black page */
            media: '(prefers-color-scheme: dark)',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#f4fdfb',
            media: '(prefers-color-scheme: light)',
          },
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        },
        { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
        {
          tag: 'meta',
          attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'AI Sentinel' } },
        { tag: 'meta', attrs: { name: 'format-detection', content: 'telephone=no' } },
        // --- Social cards --------------------------------------------------
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE}/og.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:alt',
            content: 'AI Security Sentinel — defensive & offensive AI security field manual',
          },
        },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE}/og.png` } },
        // --- Service worker registration -----------------------------------
        { tag: 'script', attrs: { src: '/register-sw.js', defer: true } },
      ],
    }),
  ],

  /**
   * The Cloudflare adapter is attached for build/preview only — `astro dev` runs in plain
   * Node. Attach it and the adapter's dev path takes over prerendered pages, rendering them
   * through Astro's production environment (`productionEnvironment.resolve`), which cannot
   * resolve Starlight's Search client script:
   *
   *   Unable to resolve [.../starlight/dist/components/Search.astro?astro&type=script&index=0&lang.ts]
   *
   * Every route in this site is prerendered, so nothing in dev needs the adapter at all.
   *
   * Why the adapter is needed for builds: it defaults to prerendering in workerd, where
   * Starlight's heading components fail (satteri's native binding is not loadable there).
   * `prerenderEnvironment: 'node'` is the documented fix — "Set this option to 'node' when
   * your prerendered pages depend on Node.js APIs or NPM packages that are not compatible
   * with workerd."
   *
   * Astro has no command-conditional `adapter` hook: the option cannot be a function (only
   * `server` supports that) and an integration adding an adapter from `astro:config:setup`
   * never gets that adapter's own hooks run — Astro unshifts `config.adapter` into the
   * integration list before the hook loop starts. So the CLI command is read from argv.
   */
  adapter: isDevCommand() ? undefined : cloudflare({ prerenderEnvironment: 'node' }),

  /**
   * This is a prerendered docs site with no session usage. `session: false` tells the
   * Cloudflare adapter not to configure its default KV driver, so no SESSION namespace is
   * provisioned on deploy and the session runtime stays out of the Worker bundle.
   */
  session: false,
});
