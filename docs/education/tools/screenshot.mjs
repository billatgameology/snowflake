// Screenshot education-site pages in both themes, and report console errors.
//   node shoot.mjs <file.html> [more.html ...]
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve, basename } from "node:path";
import { mkdirSync } from "node:fs";

const OUT = "C:/Users/biao3/AppData/Local/Temp/claude/g--Code-Files-snowflake-education/47b4a850-d5e1-4418-8808-b985a1442b84/scratchpad/shots";
mkdirSync(OUT, { recursive: true });

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node shoot.mjs <file.html> [...]");
  process.exit(1);
}

const browser = await chromium.launch();
let problems = 0;

for (const file of files) {
  const abs = resolve(file);
  const url = pathToFileURL(abs).href;
  const stem = basename(file, ".html");

  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });

    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push("console: " + m.text());
    });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

    await page.goto(url, { waitUntil: "networkidle" }).catch((e) => errors.push("goto: " + e.message));
    await page.waitForTimeout(900);

    // measure horizontal overflow of the page body
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return { scrollW: d.scrollWidth, clientW: d.clientWidth };
    });
    if (overflow.scrollW > overflow.clientW + 1) {
      errors.push(`H-OVERFLOW: scrollWidth ${overflow.scrollW} > clientWidth ${overflow.clientW}`);
    }

    // count figures that fell back to the missing-image placeholder
    const missing = await page.evaluate(() => document.querySelectorAll(".figure__missing").length);
    const figures = await page.evaluate(() => document.querySelectorAll(".figure[data-src]").length);

    const path = `${OUT}/${stem}-${theme}.png`;
    await page.screenshot({ path, fullPage: true });

    const flag = errors.length ? "  <-- PROBLEMS" : "";
    console.log(`${stem} [${theme}]  figures ${figures - missing}/${figures} loaded  ->  ${path}${flag}`);
    for (const e of errors) { console.log("    " + e); problems++; }

    await page.close();
  }
}

await browser.close();
console.log(problems ? `\n${problems} problem(s) found.` : "\nNo problems found.");
