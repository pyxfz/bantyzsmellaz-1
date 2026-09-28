import { defineHastPlugin } from 'satteri';

/**
 * Send every link that leaves the site to a new tab — including URLs that the reports
 * present as inline code.
 *
 * Astro 7 renders Markdown with Sätteri, so this is a Sätteri hast plugin (the
 * equivalent of a rehype plugin) rather than `markdown.rehypePlugins`:
 * https://docs.astro.build/en/guides/markdown-content/#markdown-processor-plugins
 *
 * Two visitors:
 *
 * 1. `a` — every real link whose href is absolute gets `target="_blank"` plus a
 *    `rel`, so it opens in a new page instead of replacing the manual. Same-site
 *    links (all root-relative here, e.g. `/part-1-…/`) keep navigating in place.
 *
 * 2. `code` — the reports write most URLs as inline code (`https://www.orcarouter.ai/`),
 *    which renders as plain, unclickable text, so on a phone there is nothing to tap.
 *    When an inline code span contains *exactly one URL and nothing else*, it is wrapped
 *    in a link to that URL. This is deliberately narrow: `curl https://api.orcarouter.ai/v1`
 *    or `ChatOpenAI(base_url="https://api.abliteration.ai/v1")` are code, not links, and
 *    fenced code blocks (`pre > code`) are never touched — those are samples to copy.
 *
 * `rel` is set explicitly because a bare `target="_blank"` hands the new page a
 * `window.opener` reference, and the trailing marker is the accessibility warning
 * for new-window links, styled by `a[target='_blank'] > span` in src/custom.css.
 */
export const externalLinksNewTab = defineHastPlugin({
  name: 'external-links-new-tab',
  element: [
    {
      filter: ['a'],
      visit(node, ctx) {
        // Already handled below (a URL that was inline code): don't add a second marker.
        if (node.properties?.['data-sentinel-external'] === 'true') return;

        const href = node.properties?.href;
        if (typeof href !== 'string' || !isExternalUrl(href)) return;

        markExternal(node, ctx);
      },
    },
    {
      filter: ['code'],
      visit(node, ctx) {
        const parent = ctx.parent(node);
        // `pre > code` is a fenced block; keep those as literal samples.
        if (parent?.type !== 'element' || parent.tagName === 'pre') return;
        // Never nest a link inside a link.
        if (parent.tagName === 'a') return;

        const url = ctx.textContent(node).trim();
        if (!isBareHttpUrl(url)) return;

        const marker = {
          type: 'element',
          tagName: 'span',
          properties: { 'aria-hidden': 'true' },
          children: [{ type: 'text', value: ' \u2197' }],
        };

        // `wrapNode` makes the code span the link's first child and keeps declared
        // children (the marker) after it, so this renders as `<a><code>url</code> ↗</a>`
        // and the span keeps its code styling.
        ctx.wrapNode(node, {
          type: 'element',
          tagName: 'a',
          properties: {
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            'data-sentinel-external': 'true',
          },
          children: [marker],
        });
      },
    },
  ],
});

function markExternal(node, ctx) {
  ctx.setProperty(node, 'target', '_blank');
  ctx.setProperty(node, 'rel', 'noopener noreferrer');
  ctx.setProperty(node, 'data-sentinel-external', 'true');
  ctx.appendChild(node, {
    type: 'element',
    tagName: 'span',
    properties: { 'aria-hidden': 'true' },
    children: [{ type: 'text', value: ' \u2197' }],
  });
}

/** Absolute URLs leave the site; every internal link here is root-relative. */
function isExternalUrl(href) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href);
}

/** True when the text is one whole http(s) URL — no surrounding command, no whitespace. */
function isBareHttpUrl(text) {
  return /^https?:\/\/[^\s<>"'`]+$/i.test(text);
}
