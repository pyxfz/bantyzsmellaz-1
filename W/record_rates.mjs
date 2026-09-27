// Records a smooth browser walkthrough of today's gold & silver spot rates.
// Playwright's native screencast captures the page but NOT the OS cursor, so we
// inject a synthetic cursor that eases between targets and ripples on click.
// Native capture is 25fps; ffmpeg minterpolate promotes it to a true 60fps.
import { chromium } from "playwright";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "/tmp/rec";
const URL = "https://www.goldprice.org/";
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
await page.waitForTimeout(2500);

// ---- synthetic cursor + click ripple -------------------------------------
await page.addStyleTag({
  content: `
  #__cur { position:fixed; z-index:2147483647; width:22px; height:22px; margin:-11px 0 0 -11px;
           border-radius:50%; border:2.5px solid #111; background:rgba(255,255,255,.85);
           box-shadow:0 1px 5px rgba(0,0,0,.45); pointer-events:none; }
  #__ring { position:fixed; z-index:2147483646; width:12px; height:12px; margin:-6px 0 0 -6px;
            border-radius:50%; border:2px solid #ff3b30; opacity:0; pointer-events:none; }
  `,
});
await page.evaluate(({ VW, VH }) => {
  const c = document.createElement("div"); c.id = "__cur";
  const r = document.createElement("div"); r.id = "__ring";
  document.body.append(c, r);
  const st = { x: VW / 2, y: VH / 3, sx: VW / 2, sy: VH / 3 };
  const place = () => {
    c.style.left = st.x + "px"; c.style.top = st.y + "px";
    r.style.left = st.x + "px"; r.style.top = st.y + "px";
  };
  place();
  window.__moveTo = (x, y, dur) => new Promise(res => {
    const x0 = st.x, y0 = st.y, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
      st.x = x0 + (x - x0) * e;
      st.y = y0 + (y - y0) * e;
      place();
      if (p < 1) requestAnimationFrame(step);
      else { st.x = x; st.y = y; place(); res(); }
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
}, { VW, VH });

const glide = (x, y, dur = 900) =>
  page.evaluate(([x, y, d]) => window.__moveTo(x, y, d), [x, y, dur]);
const ripple = () => page.evaluate(() => window.__ripple());
const pause = (ms) => page.waitForTimeout(ms);
const log = (s) => console.log("  " + s);

async function goTo(sel, { click = false, dur = 850, nth = 0 } = {}) {
  const loc = page.locator(sel).nth(nth);
  const box = await loc.boundingBox().catch(() => null);
  if (!box) { log("! not found: " + sel); return false; }
  await glide(box.x + box.width / 2, box.y + box.height / 2, dur);
  await pause(280);
  if (click) {
    await ripple();                    // visual feedback for the viewer
    await pause(140);
    await loc.click({ timeout: 5000 }).catch((e) => log("! click failed: " + sel));
  }
  return true;
}

// ---- the walkthrough ----------------------------------------------------
log("navigating to goldprice.org");
await glide(VW / 2, 300, 700);
await pause(1500);

log("dismissing cookie banner");
await goTo('button:has-text("Allow all cookies")', { click: true, dur: 800 });
// the modal goes hidden, it is not removed from the DOM
const gone = await page
  .locator('button:has-text("Allow all cookies")')
  .first()
  .waitFor({ state: "hidden", timeout: 8000 })
  .then(() => true)
  .catch(() => false);
log(gone ? "cookie banner dismissed OK" : "!! cookie banner STILL PRESENT");
await pause(1800);

const cb = page.getByRole("combobox");

log("hovering the gold spot price");
await glide(190, 122, 800);
await pause(2000);

log("hovering the silver spot price");
await glide(590, 122, 850);
await pause(2000);

log("toggling gold units oz -> kg");
const unit = cb.nth(2);                       // oz/kg selector, top row
let ub = await unit.boundingBox().catch(() => null);
if (ub) {
  await glide(ub.x + ub.width / 2, ub.y + ub.height / 2, 700);
  await pause(300);
  await ripple(); await pause(200);
  await unit.selectOption({ label: "kg" }).catch(() => log("! unit select failed"));
  await pause(2400);
}

log("switching the metal selector to Silver");
const metal = cb.nth(0);                     // Gold/Silver selector, top row
let mb = await metal.boundingBox().catch(() => null);
if (mb) {
  await glide(mb.x + mb.width / 2, mb.y + mb.height / 2, 750);
  await pause(300);
  await ripple(); await pause(200);
  await metal.selectOption({ label: "Silver" }).catch(() => log("! metal select failed"));
  await pause(2600);
}

log("restoring gold + troy ounce");
await metal.selectOption({ label: "Gold" }).catch(() => {});
await pause(1200);
await unit.selectOption({ label: "oz" }).catch(() => {});
await pause(2200);

log("scrolling down through the performance tables");
for (let i = 0; i < 3; i++) {
  await page.mouse.wheel(0, 380);
  await glide(VW / 2, VH / 2, 500);
  await pause(800);
}
await pause(2200);

log("scrolling back to the headline rates");
for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -360); await pause(600); }
await pause(1500);
await glide(400, 130, 700);
await pause(2600);

await context.close();   // flushes + finalises the video file
await browser.close();

const f = readdirSync(OUT).find((f) => f.endsWith(".webm"));
console.log("\nRAW_VIDEO=" + join(OUT, f));
