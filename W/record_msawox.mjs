// Records a 60fps-ready walkthrough of msawox.com
//   1. load the landing page
//   2. scroll DOWN to the Tools section
//   3. scroll back UP to the top
//   4. click the top-right Tools button -> navigates to /en/tools
//   5. on the new page, scroll down and back up
// Playwright's screencast has no OS cursor, so we inject a synthetic one that
// eases between targets and ripples on click. Native capture is 25fps; ffmpeg
// minterpolate promotes it to a true 60fps.
import { chromium } from "playwright";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "/tmp/rec2";
const URL = "https://msawox.com";
const VW = 1280, VH = 800;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"],
});
const context = await browser.newContext({
  viewport: { width: VW, height: VH },
  recordVideo: { dir: OUT, size: { width: VW, height: VH } },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(3000);

// ---- synthetic cursor + click ripple -------------------------------------
const CURSOR_CSS = `
#__cur { position:fixed; z-index:2147483647; width:22px; height:22px; margin:-11px 0 0 -11px;
         border-radius:50%; border:2.5px solid #111; background:rgba(255,255,255,.85);
         box-shadow:0 1px 5px rgba(0,0,0,.45); pointer-events:none; }
#__ring { position:fixed; z-index:2147483646; width:12px; height:12px; margin:-6px 0 0 -6px;
          border-radius:50%; border:2px solid #ff3b30; opacity:0; pointer-events:none; }
`;
const CURSOR_FN = ({ VW, VH }) => {
  const c = document.createElement("div"); c.id = "__cur";
  const r = document.createElement("div"); r.id = "__ring";
  document.body.append(c, r);
  const st = { x: VW / 2, y: VH / 3 };
  const place = () => {
    c.style.left = st.x + "px"; c.style.top = st.y + "px";
    r.style.left = st.x + "px"; r.style.top = st.y + "px";
  };
  place();
  window.__moveTo = (x, y, dur) => new Promise((res) => {
    const x0 = st.x, y0 = st.y, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      st.x = x0 + (x - x0) * e; st.y = y0 + (y - y0) * e;
      place();
      if (p < 1) requestAnimationFrame(step); else { st.x = x; st.y = y; place(); res(); }
    })(t0);
  });
  window.__ripple = () => {
    r.style.transition = "none"; r.style.opacity = ".95";
    r.style.width = r.style.height = "12px";
    requestAnimationFrame(() => {
      r.style.transition = "all .45s cubic-bezier(.2,.7,.3,1)";
      r.style.opacity = "0"; r.style.width = r.style.height = "46px";
    });
  };
};

await page.addStyleTag({ content: CURSOR_CSS });
await page.evaluate(CURSOR_FN, { VW, VH });

const glide = (x, y, d = 900) =>
  page.evaluate(([x, y, d]) => window.__moveTo(x, y, d), [x, y, d]);
const ripple = () => page.evaluate(() => window.__ripple());
const pause = (ms) => page.waitForTimeout(ms);
const log = (s) => console.log("  " + s);

// scroll a wheel notch while drifting the cursor, so the movement reads on video
async function scrollBy(dy, label) {
  await page.mouse.wheel(0, dy);
  await glide(VW / 2 + (dy > 0 ? 90 : -90), VH / 2, 620);
  await pause(700);
  if (label) log(label + " (" + (dy > 0 ? "+" : "") + dy + ")");
}

// ---- the walkthrough ----------------------------------------------------
log("loaded msawox.com");
await glide(VW / 2, 320, 800);
await pause(1800);

log("SCROLL DOWN toward the Tools section");
const total = await page.evaluate(() => document.body.scrollHeight);
log("page height " + total + "px");
const step = Math.round((VH - 140) * 0.8);
for (let y = 0; y < 5200; y += step) await scrollBy(step, null);
await pause(1200);

// land exactly on the tools grid
await page.evaluate(() => {
  const el = [...document.querySelectorAll("a")].find((a) =>
    /Score my stack/i.test(a.textContent || "")
  );
  if (el) el.scrollIntoView({ block: "center" });
});
await glide(640, 400, 800);
await pause(2600);

log("SCROLL BACK UP to the top");
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await pause(600);
// do it visibly with the wheel instead of a teleport
await page.evaluate(() => window.scrollTo({ top: 5600, behavior: "instant" }));
await pause(500);
for (let i = 0; i < 8; i++) await scrollBy(-700, null);
await pause(1200);

log("scrolling to the very top");
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await glide(880, 32, 800);
await pause(2200);

log("CLICK the top-right Tools button");
const toolsBtn = page.getByRole("link", { name: "Tools", exact: true }).first();
const tb = await toolsBtn.boundingBox().catch(() => null);
if (tb) {
  await glide(tb.x + tb.width / 2, tb.y + tb.height / 2, 700);
  await pause(320);
  await ripple();
  await pause(200);
  await Promise.all([
    page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {}),
    toolsBtn.click({ timeout: 8000 }).catch((e) => log("! click failed: " + String(e).slice(0, 60))),
  ]);
}
await pause(3000);
log("now on: " + page.url());

// re-attach the cursor to the fresh document
await page.addStyleTag({ content: CURSOR_CSS }).catch(() => {});
await page.evaluate(CURSOR_FN, { VW, VH }).catch(() => {});
await glide(VW / 2, 320, 800);
await pause(1800);

log("SCROLL DOWN on the tools page");
const t2 = await page.evaluate(() => document.body.scrollHeight);
log("tools page height " + t2 + "px");
for (let i = 0; i < 5; i++) await scrollBy(560, null);
await pause(2400);

log("SCROLL BACK UP on the tools page");
for (let i = 0; i < 5; i++) await scrollBy(-560, null);
await pause(2600);

await context.close();
await browser.close();

const f = readdirSync(OUT).find((x) => x.endsWith(".webm"));
console.log("\nRAW_VIDEO=" + join(OUT, f));
