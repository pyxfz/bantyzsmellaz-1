# AI Security Sentinel — field manual

An Astro + [Starlight](https://starlight.astro.build/) documentation site and installable PWA built from
three research reports:

- **Part I** — Top 10 Security Vulnerabilities Faced by AI Systems (OWASP LLM Top 10, 2026 revision).
- **Part II** — Offensive & Adversarial AI Models for Legal Red-Teaming (OrcaRouter, Abliteration AI,
  Adverserial AI, DreadNode, frontier comparison).
- **Part III** — Top 20 AI Security Vulnerabilities (the 2026 OWASP/agentic risk register, with framework
  mapping, mitigations, continuous-monitoring rules, a severity matrix, a 30-60-90 day roadmap, a log
  schema, 12 SIEM use cases and incident-response playbooks).

Deployment target is Cloudflare (Wrangler is configured), but nothing is deployed from this repo state —
`bun run build` only produces `dist/client`.

## Content model

```
src/content/docs/
├── index.mdx                              # landing page (splash) with numbered jump links
├── part-1-ai-security-vulnerabilities/    # Part I — sections 1–10 + summary/frameworks/sources
├── part-2-offensive-ai-models/            # Part II — sections 1–14
└── part-3-top-20-ai-security-vulnerabilities/  # Part III — sections 1–20 + cross-cutting 21–26
```

Every page is numbered: page titles carry the section number (`3. OrcaRouter`), headings carry the
subsection number (`3.1 Identity`, `13.3.7 Technique 7`), so the left nav and the right-hand table of
contents are numbered and jump to the matching anchors. Sidebar entries come from
`autogenerate` directories, which Starlight sorts by filename — hence the `01-…` filename prefixes.

## Commands

```bash
bun install
bun run dev        # local dev server on :4321 (service worker registration is disabled here)
bun run build      # build into dist/client (also builds the Pagefind search index)
bun run preview    # build + preview
bun run assets     # regenerate favicon/icon/OG PNGs from scripts/generate-assets.mjs
```

## Deploying

The built site is **`dist/client`**. `dist/` also contains an empty `dist/server` (the adapter reports
`assetsOnly` for this fully prerendered site), so deploying `dist` itself publishes only the `client/`
and `server/` folders and every URL 404s.

```bash
# Cloudflare Workers — reads wrangler.jsonc and follows the adapter's redirect to
# dist/client/wrangler.json, so it uploads the right assets automatically
bun run deploy

# Cloudflare Pages — must point at dist/client
bun run panty
```

### "Using redirected Wrangler configuration"

Every deploy logs this:

```
Using redirected Wrangler configuration.
 - Configuration being used: "dist/client/wrangler.json"
 - Original user's configuration: "wrangler.jsonc"
 - Deploy configuration file: ".wrangler/deploy/config.json"
```

That is **expected, informational output** (Wrangler logs it at `info` level, not as a warning), and it is a
documented Cloudflare feature rather than a workaround. Wrangler's docs describe it under *Redirected
configuration*:

> Some framework tools, or custom pre-build processes, generate a modified Wrangler configuration to be
> used to deploy the Worker code. In this case, the tool may also create a special `.wrangler/deploy/config.json`
> file that redirects Wrangler to use the generated configuration rather than the original, user's
> configuration. … Wrangler will display messaging to the user to indicate that the configuration has been
> redirected to a different file than the user's configuration file.

So the flow here is: `astro build` runs the Cloudflare adapter, which writes the deployable configuration
into the build output (`dist/client/wrangler.json`) and points `.wrangler/deploy/config.json` at it
(`{ "configPath": "../../dist/client/wrangler.json" }`). Wrangler then deploys from *that* file. Practical
consequences:

- **Do not delete `.wrangler/deploy/config.json` or bypass it with `--config`.** The generated file is what
  carries the correct `assets.directory` (`"."`, i.e. relative to `dist/client`) and the adapter-provisioned
  bindings. Falling back to `wrangler.jsonc` would make `./dist` the assets root — the same layout error that
  published only `client/` and `server/` and 404'd every URL.
- **`astro build` must run first** — the redirect file and the generated config are build artifacts. Both
  deploy scripts do that, and `.wrangler` plus `dist/` are gitignored, so CI must build rather than reuse
  committed artifacts.
- **No environments.** Cloudflare's docs: "The generated configuration file should not include any
  environments … should be created as part of a build step, which should already target a specific
  environment." Our generated config reports `definedEnvironments: []`, so `wrangler deploy --env <name>` has
  no effect through the redirect — build per environment instead.
- **The redirect applies to six commands:** `wrangler deploy`, `wrangler dev`, `wrangler versions upload`,
  `wrangler versions deploy`, `wrangler pages deploy` and `wrangler pages functions build` — so `bun run panty`
  logs the same line. For Pages it is cosmetic: the upload directory comes from the CLI argument
  (`./dist/client`), and the generated `name` ("ofs") is overridden by `--project-name=aizas`. Keep passing
  `./dist/client` and `--project-name`.
- **Keys that do not survive** into the generated config for this fully prerendered site: `main`,
  `assets.binding` and `assets.directory` (the adapter decides the entry point, drops the binding because
  there is no Worker code, and rewrites the directory). They are kept in `wrangler.jsonc` so the config still
  works if on-demand rendering is ever enabled, but they are *not* what deploys.

Both are wired that way in `package.json`. In the Cloudflare dashboard (Workers Builds / Pages CI),
set the build command to `bun run build` and the output directory to `dist/client`.

- **404s** — `wrangler.jsonc` sets `assets.not_found_handling: "404-page"`, which the adapter carries
  into its generated config, so unknown paths serve the prerendered `404.html`. Pages does this by
  convention. Verified with `wrangler dev`: `/` and doc pages 200, `/does-not-exist` renders the
  Starlight 404 page.
- **`public/.assetsignore`** — keeps Wrangler artifacts out of the upload. It excludes the generated
  `wrangler.json` (which contains absolute build paths), so `/wrangler.json` 404s instead of leaking a
  local path.

## Design

- **Theme** — AMOLED synthwave: `--sent-ink: #000` drives `--sl-color-bg`, the nav and the sidebar,
  so on an OLED panel those pixels switch off entirely, and regions are separated by one thin
  low-contrast hairline (`--sent-hairline: hsl(192 70% 11%)`) instead of by fills. The character comes
  from the mint/teal/cyan accents and a deliberately faint background bloom. Starlight maps the
  Expressive Code surface and card backgrounds to `--sl-color-gray-6` in dark mode, so that one
  surface is a barely-raised teal-black (`--sent-ink-3: hsl(196 70% 6%)`) rather than #000 — otherwise
  code blocks would be invisible against the page. Expressive Code also sets
  `frameBoxShadowCssValue: none` when using Starlight's UI colours, so `src/custom.css` adds the seam
  back (`box-shadow: 0 0 0 1px var(--sent-hairline)` plus a faint bloom). The palette lives in
  `src/custom.css`; `scripts/generate-assets.mjs` mirrors it for the icons and OG card, and
  `astro.config.mjs` / `manifest.webmanifest` / `offline.html` use `#000000` for `theme-color` so the
  browser and OS chrome blend into the page. Custom CSS is unlayered, which Starlight documents as
  overriding its own cascade layers.
- **Typography** — Space Grotesk (display/headings, with a soft glow), Inter (body), JetBrains Mono
  (code). Loaded as Fontsource CSS files through Starlight's documented `customCss` + `--sl-font`
  pattern, so all fonts are self-hosted and the PWA works offline.
- **Reading layout (desktop, ≥72rem)** — the two side columns are the **same width** (16rem each) so the
  nav and the "on this page" list frame the reading pane symmetrically, and the leftover space is split
  evenly between the two sides, so neither margin is ever lopsided. Measured at 1440px: nav 256px, prose
  870px, TOC column 256px, 24px of margin on each side of the prose, and 290px between the last word and
  the right edge (that was 450px before the fix below). Four things make it work:
  - `--sl-sidebar-width: 16rem` (Starlight default 18.75rem) sets the left nav's width.
  - `--sl-content-width: 60rem` (default 45rem) widens the prose so it stays by far the widest column.
  - `--sl-content-margin-inline: auto` centers that prose in its pane. Starlight sets `auto 0` here,
    which pushes all of the leftover space onto the nav side and leaves a wide left margin.
  - `--sent-toc-width: var(--sl-sidebar-width)` gives the right column the nav's width (point it at a
    length such as `10rem` to let the two differ) *and* `[data-has-sidebar][data-has-toc] .main-pane`
    takes `calc(100% - var(--sent-toc-width))`. This last part matters: Starlight gives `.main-pane` and
    `.right-sidebar-container` widths from one formula that adds up to exactly 100% of the row, so pinning
    only the TOC column leaves a hole on the right (it measured 450px at 1440px before this rule).
    Starlight's `.right-sidebar` is also `position: fixed; width: 100%`, so it is sized too — otherwise the
    panel spans the viewport and its entries run off the right edge.

  The two columns also share the same inner gutter (`--sl-sidebar-pad-x`) and the same link type size
  (`--sl-text-sm`, with h3 entries a step down at `--sl-text-xs`), so they read as a pair rather than as
  a nav and a footnote. TOC entries measure 213px wide at 1440px with none wrapping off the column.

  The TOC is a jump list, so it also gets tighter padding, smaller type and no wasted `--sl-container`
  width. Section headings get `scroll-margin-top` so a followed link lands below the sticky header
  (plus the mobile TOC bar below 72rem).
- **Numbered contents box on every page, at every width** — its own TOC, in the page, on top of
  Starlight's: `src/components/PageTitle.astro` (a Starlight component override, registered via
  `components` in `astro.config.mjs`) renders the page `<h1>` and then
  `src/components/SentinelToc.astro`, so a numbered "Contents" box sits directly under the heading on
  every documentation page. It lists the page's h2–h3 headings in order, splits into as many columns as
  fit, is open by default and collapsible (native `details`), and every entry is a `#slug` anchor, so
  tapping one jumps to that section with no JavaScript. Verified at 390/1024/1152/1440px: the box sits
  18px under the heading, entries are 100% numbered, and a click scrolls to the section with the heading
  landing below the sticky header. This is in *addition* to Starlight's right-hand column (which only
  exists from 72rem up, and below that is hidden behind a collapsed bar under the header — which is why
  the box is always rendered rather than only below the breakpoint). Headings carry their section numbers
  (`3.1 Identity`, `13.3.7 Technique 7`) and Starlight's unnumbered page-title entry (`#_top`, labelled
  "Overview") is filtered out of both the box and the column, so every entry is a numbered section. The
  home page is the one exception: it is `template: splash` (a separate landing page with no docs sidebar,
  so Starlight builds no heading list for it) and keeps its own numbered contents lists in the body.
- **Wide content** — tables are `display: block` + `overflow-x: auto` with a minimum cell width so wide
  comparison matrices scroll sideways instead of stretching the page; code blocks and inline code wrap or
  scroll on their own axes. `body { overflow-x: clip }` keeps page-level scrolling intact on mobile.
- **Code blocks** — Starlight's `expressiveCode` uses a dark + light theme pair (`synthwave-84`,
  `github-light`), as Starlight requires for its theme switch to stay in sync, with
  `useStarlightUiThemeColors: true` so code block chrome follows the site palette.
- **Links** — every off-site URL opens in a new tab (`target="_blank"` + `rel="noopener noreferrer"`)
  with an `↗` marker, added by a Sätteri hast plugin in `plugins/external-links.mjs`. Astro 7 renders
  Markdown with Sätteri, so this is a processor plugin rather than `markdown.rehypePlugins` (those
  legacy options need `@astrojs/markdown-remark` installed). Same-site links still navigate in place.
- **URLs the reports show as inline code are clickable** — most URLs in these documents are written as
  inline code (`https://www.orcarouter.ai/`), which renders as plain unclickable text, so on a phone
  there is nothing to tap. The same plugin wraps an inline code span in a link **when the span is exactly
  one URL and nothing else** (212 off-site links in the build, 197 of them from code spans, all verified
  to carry `target="_blank"` + `rel`). The narrowness is the point: `curl https://api.orcarouter.ai/v1`,
  `ChatOpenAI(base_url="https://api.abliteration.ai/v1")` and every fenced code block stay literal
  samples with no anchor inside them. The span keeps its code styling and the link is styled through
  `a[target='_blank'] > code` in `src/custom.css`, so it still reads as code that happens to be tappable.
- **PWA** — `public/manifest.webmanifest`, `public/sw.js` (network-first for documents, cache-first for
  hashed assets, offline fallback to `public/offline.html`) and `public/register-sw.js` (skips the dev
  server). Bump `VERSION` in `sw.js` on every deploy: `activate` deletes every cache that does not end in
  the current version, which is what stops a returning visitor from being served the previous build's
  shell. Icons, Apple touch icon, OG card and favicon are generated by `scripts/generate-assets.mjs`
  using `sharp`. Astro has no official PWA guide, so this follows the web-standard manifest + service
  worker approach; `@vite-pwa/astro` is the community integration if you later want Workbox.

## Cloudflare adapter settings

The adapter is attached for `astro build` / `astro preview` only. `astro dev` runs in plain Node.

- **Why dev has no adapter** — every route here is prerendered, so dev needs nothing from the adapter.
  Attach it and the adapter's prerender middleware takes over prerendered pages, rendering them through
  Astro's production environment (`productionEnvironment.resolve`), which cannot resolve Starlight's
  Search client script and logs this on every page load:

  ```
  Unable to resolve [.../starlight/dist/components/Search.astro?astro&type=script&index=0&lang.ts]
  ```

  Astro has no command-conditional `adapter` option: it cannot be a function (only `server` supports
  that) and an integration that adds an adapter from `astro:config:setup` never gets that adapter's own
  hooks run — Astro unshifts `config.adapter` into the integration list before the hook loop starts. So
  `astro.config.mjs` reads the CLI command from argv.
- **`prerenderEnvironment: 'node'`** (build) — Starlight's heading components use the `satteri` Markdown
  engine, whose native Node binding is not loadable in workerd. The adapter docs say to set this option
  to `'node'` when prerendered pages depend on packages that workerd can't run. Without it, both
  `astro build` and `astro dev` fail on `Cannot find module '@bruits/satteri-wasm32-wasi'`.
- **`session: false`** — this site has no session usage, so opting out stops the adapter from configuring
  its default KV session driver. No `SESSION` namespace is provisioned on deploy and the session runtime
  stays out of the Worker bundle.

`astro build` writes the deployable site to `dist/client` (plus an adapter-generated
`dist/client/wrangler.json`), and `.wrangler/deploy/config.json` redirects Wrangler to it — so the
`wrangler.jsonc` in the repo only needs the project name and any bindings. `dist/` and `.wrangler/` are
both gitignored. This is a static build: the adapter reports `assetsOnly`, so no Worker bundle is emitted.

### Known warnings

- `[content] The collection "i18n" does not exist or is empty.` — Starlight always probes the optional
  `i18n` collection for custom UI translations (`@astrojs/starlight/dist/utils/translations.js`). It is
  harmless; it goes away if you add `src/content/i18n/<lang>.json` and register `i18nLoader` /
  `i18nSchema` in `src/content.config.ts`.

`site` in `astro.config.mjs` is currently a placeholder origin used for canonical and Open Graph URLs —
set it to the real deployment URL before publishing.

## Attribution

Report content is compiled from public vendor documentation, OWASP/NIST/MITRE frameworks and third-party
reporting; Part II is intended for authorized security testing only.
