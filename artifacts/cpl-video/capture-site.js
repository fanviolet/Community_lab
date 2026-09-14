const { chromium } = require("playwright");

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await page.goto("https://community-lab.vercel.app", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.screenshot({
    path: "artifacts/cpl-video/source/cpl-home.png",
    fullPage: false,
  });

  await page.goto("https://community-lab.vercel.app/dashboard/groups", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.screenshot({
    path: "artifacts/cpl-video/source/cpl-product.png",
    fullPage: false,
  });

  const guestButton = page.getByRole("button", { name: "Khách", exact: true });
  if (await guestButton.isVisible().catch(() => false)) {
    await guestButton.click();
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForTimeout(10000);
    await page.screenshot({
      path: "artifacts/cpl-video/source/cpl-dashboard.png",
      fullPage: false,
    });
  }

  await browser.close();
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
