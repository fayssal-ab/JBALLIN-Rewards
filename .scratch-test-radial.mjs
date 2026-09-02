import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const ADMIN_PASSWORD = "d6f04fd001b9ecaf";
const OUT = "/tmp/claude-1000/-home-yukinee-Desktop-JBALLIN/41987f5c-4aed-4881-ab22-c7d902e66dc9/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto(`${BASE}/admin`);
await page.waitForTimeout(500);
const adminBtn = page.locator('button:has-text("Admin")');
if (await adminBtn.count()) {
  await adminBtn.click();
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button:has-text("Go")').click();
  await page.waitForTimeout(800);
}

await page.goto(`${BASE}/admin/winner-picker`);
await page.waitForTimeout(1200);

// Test 1: small count, normal names
const nameInput = page.locator('input[placeholder="Type or paste a list"]');
for (const n of ["Amina", "Bilal", "Chaimae", "Driss"]) {
  await nameInput.fill(n);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
}
await page.screenshot({ path: `${OUT}/radial-1-few-names.png`, fullPage: true });
console.log("1. Few names, radial text check");

// Test 2: replicate the user's stress scenario - many short names + one very long junk name
for (let i = 0; i < 16; i++) {
  await nameInput.fill(String.fromCharCode(65 + (i % 26)));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(60);
}
await nameInput.fill("ASAGDGSFASFASFASFASFASFASFAE222");
await page.keyboard.press("Enter");
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/radial-2-stress-test.png`, fullPage: true });
console.log("2. Stress test with 20+ wedges + one very long name");

await browser.close();
console.log("DONE");
