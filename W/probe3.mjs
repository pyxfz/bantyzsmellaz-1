import { chromium } from "playwright";
const b = await chromium.launch({ headless:true, args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{width:1280,height:800} });
const t0=Date.now();
try {
  const r = await p.goto("https://www.linkedin.com/in/m0ham3dx/", { waitUntil:"domcontentloaded", timeout:45000 });
  await p.waitForTimeout(3000);
  console.log("status:", r.status(), " url:", p.url(), " in", Date.now()-t0, "ms");
  console.log("title:", (await p.title()).slice(0,90));
  console.log("body chars:", (await p.evaluate(()=>document.body.innerText)).length);
  console.log("looks like login wall:", /sign in|log in|join linkedin/i.test(await p.evaluate(()=>document.body.innerText)));
} catch(e){ console.log("FAILED:", String(e).slice(0,140)); }
await b.close();
