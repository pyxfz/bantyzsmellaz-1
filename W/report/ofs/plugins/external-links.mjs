import { defineHastPlugin } from 'satteri';

/**
 * Open links to other sites in a new tab.
 *
 * Astro 7 renders Markdown with Sätteri, so this is a Sätteri hast plugin (the
 * equivalent of a rehype plugin) rather than `markdown.rehypePlugins`:
 * https://docs.astro.build/en/guides/markdown-content/#markdown-processor-plugins
 *
 * Only real links are touched. URLs written inside inline code or fenced code
 * blocks stay literal text — `curl https://api.orcarouter.ai/v1` must not turn
 * into a link — and same-site links (all root-relative here, e.g. `/part-1-…/`)
 * keep navigating in place.
 *
 * `rel` is set explicitly because a bare `target="_blank"` hands the new page a
 * `window.opener` reference, and the trailing marker is the accessibility
 * warning for new-window links, styled by `a[target='_blank'] > span` in
 * src/custom.css.
 */
export const externalLinksNewTab = defineHastPlugin({
  name: 'external-links-new-tab',
  element: [
    {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== 'string' || !isExternalUrl(href)) return;

        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'span',
          properties: { 'aria-hidden': 'true' },
          children: [{ type: 'text', value: ' \u2197' }],
        });
      },
    },
  ],
});

/** Absolute URLs leave the site; every internal link here is root-relative. */
function isExternalUrl(href) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href);
}
