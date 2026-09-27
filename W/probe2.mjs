import { chromium } from "playwright";
const b = await chromium.launch({ headless:true, args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{width:1280,height:800} });
await p.goto("https://msawox.com", { waitUntil:"domcontentloaded", timeout:60000 });
await p.waitForTimeout(3500);

const H = await p.evaluate(() => document.body.scrollHeight);
console.log("page height:", H, " viewports:", (H/800).toFixed(1));

console.log("\n-- nav + top-right links with href + box --");
for (const t of ["Approach","Focus","Outcomes","Lessons","Hackathons","Tools","GET","Change language"]) {
  const l = p.getByRole("link", { name: t, exact: true }).or(p.getByRole("button", { name: t, exact: true })).first();
  const n = await p.getByRole("link",{name:t,exact:true}).count() + await p.getByRole("button",{name:t,exact:true}).count();
  if (!n) { console.log(`  '${t}': NOT FOUND`); continue; }
  const href = await l.getAttribute("href").catch(()=>null);
  const bb = await l.boundingBox().catch(()=>null);
  console.log(`  '${t}': count=${n} href=${href} box=${bb?JSON.stringify({x:Math.round(bb.x),y:Math.round(bb.y),w:Math.round(bb.width),h:Math.round(bb.height)}):"null"}`);
}

console.log("\n-- Tools section position --");
const tools = p.getByRole("link", { name: "Tools", exact: true }).first();
await tools.scrollIntoViewIfNeeded().catch(()=>{});
await p.waitForTimeout(1200);
const tb = await tools.boundingBox().catch(()=>null);
const sy = await p.evaluate(() => Math.round(window.scrollY));
console.log("  Tools nav link box:", tb?JSON.stringify({x:Math.round(tb.x),y:Math.round(tb.y)}):"null", " scrollY:", sy);
const firstTool = p.locator('a:has-text("Score my stack")').first();
const fb = await firstTool.boundingBox().catch(()=>null);
console.log("  'Score my stack' box:", fb?JSON.stringify({x:Math.round(fb.x),y:Math.round(fb.y)}):"null", "scrollY:", await p.evaluate(()=>Math.round(window.scrollY)));
await b.close();
