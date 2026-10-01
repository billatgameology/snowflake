import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:5173/named-crystal-catalog.html";
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await new Promise((resolve) => browser.once("disconnected", resolve));
