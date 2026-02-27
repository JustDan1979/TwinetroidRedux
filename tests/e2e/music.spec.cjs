const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

async function openStory(page) {
  const fileUrl = pathToFileURL(path.resolve(__dirname, '../../index.html')).href;
  await page.goto(fileUrl);
  await page.waitForSelector('#story');
  await page.waitForFunction(() => window.SugarCube && window.SugarCube.Engine && window.SugarCube.State);
}

test('Music controls respond to toggle and volume', async ({ page }) => {
  await openStory(page);

  const toggle = page.locator('#music-toggle');
  const volume = page.locator('#music-volume');

  await expect(toggle).toBeVisible();
  await expect(volume).toBeVisible();

  const info = await page.evaluate(() => {
    const el = document.querySelector('#music-volume');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      disabled: el.disabled,
      pointer: getComputedStyle(el).pointerEvents,
      hitId: hit && hit.id
    };
  });

  expect(info).not.toBeNull();
  expect(info.pointer).not.toBe('none');
  expect(info.hitId).toBe('music-volume');

  const beforeEnabled = await page.evaluate(() => window.SugarCube.State.variables.musicEnabled);
  await toggle.click();
  const afterEnabled = await page.evaluate(() => window.SugarCube.State.variables.musicEnabled);
  expect(afterEnabled).not.toBe(beforeEnabled);

  await page.evaluate(() => {
    const el = document.querySelector('#music-volume');
    if (!el) return;
    el.value = '0.2';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const volumeValue = await page.evaluate(() => window.SugarCube.State.variables.musicVolume);
  expect(volumeValue).toBeLessThan(0.3);
});
