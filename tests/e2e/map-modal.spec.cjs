const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

async function openStory(page) {
  const fileUrl = pathToFileURL(path.resolve(__dirname, '../../Twinetroid.html')).href;
  await page.goto(fileUrl);
  await page.waitForSelector('#story');
  await page.waitForFunction(() => window.SugarCube && window.SugarCube.Engine && window.SugarCube.State);
}

test('Map modal view (headed)', async ({ page }) => {
  await openStory(page);

  await page.evaluate(() => {
    const vars = window.SugarCube.State.variables;
    vars.displayStats = 1;
    vars.displayMap = 1;
    vars.location = 'Brinstar ';
    vars.items = Array.isArray(vars.items) ? vars.items : [];
    if (!vars.items.includes('BrinstarMap ')) {
      vars.items.push('BrinstarMap ');
    }
    window.SugarCube.Engine.play('01');
    if (window.SugarCube.UIBar && window.SugarCube.UIBar.unstow) {
      window.SugarCube.UIBar.unstow(true);
    }
  });

  const viewMap = page.getByRole('link', { name: /view map/i });
  await expect(viewMap).toBeVisible();
  await viewMap.click();

  const modal = page.locator('#map-modal');
  await expect(modal).toHaveClass(/open/);

  // Give time to inspect/iterate when running headed.
  await page.waitForTimeout(8000);
});
