// Read-only browser checks. Requires Playwright (PLAYWRIGHT_MODULE can point to an external install).
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.AUDIT_URL || "http://localhost:3000/";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    const slider = page.getByRole("slider", { name: "Choose a colour to browse products", exact: true });
    await slider.waitFor({ timeout: 45000 });
    const close = page.getByRole("button", { name: "Close favourites popup", exact: true });
    if (await close.isVisible()) await close.click();
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 1000 });
      const thumbnails = page.getByRole("button", { name: /^Show image \d+ of / });
      assert(await thumbnails.count() > 1, "Product preview thumbnails must be present");
      const alternate = thumbnails.filter({ has: page.locator('img') }).nth(1);
      const source = await alternate.locator("img").getAttribute("src");
      await alternate.click();
      assert.equal(await alternate.getAttribute("aria-pressed"), "true");
      // Verify a non-thumbnail preview uses the selected source.
      assert(await page.locator("img").evaluateAll((images, src) => images.some(image => image.getAttribute("src") === src && !image.closest("button")), source));
      await alternate.focus();
      await page.keyboard.press("Enter");
      assert.equal(await alternate.getAttribute("aria-pressed"), "true");
      await slider.scrollIntoViewIfNeeded();
      await slider.focus();
      await page.keyboard.press("Home");
      assert.equal(await slider.inputValue(), "0");
      if (Number(await slider.getAttribute("max")) > 0) {
        const firstColour = await slider.getAttribute("aria-valuetext");
        await page.keyboard.press("ArrowRight");
        assert.equal(await slider.inputValue(), "1");
        assert.notEqual(await slider.getAttribute("aria-valuetext"), firstColour);
        await page.keyboard.press("End");
        assert.equal(await slider.inputValue(), await slider.getAttribute("max"));
        await page.keyboard.press("Home");
        assert.equal(await slider.inputValue(), "0");
      }
      console.log(`${width}px: thumbnail click/keyboard preview and named colour-slider keyboard controls passed`);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
