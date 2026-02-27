const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

async function openStory(page) {
  const fileUrl = pathToFileURL(path.resolve(__dirname, '../../index.html')).href;
  await page.goto(fileUrl);
  await page.waitForSelector('#story');
  await page.waitForFunction(() => window.SugarCube && window.SugarCube.Engine && window.SugarCube.State);
  await page.evaluate(() => {
    window.__twDisable3DDice = true;
    if (typeof window.__twRandomFixed === 'number' && window.SugarCube && SugarCube.Util) {
      const fixed = window.__twRandomFixed;
      SugarCube.Util.random = (min, max) => Math.floor(fixed * (max - min + 1)) + min;
    }
    if (typeof window.__twRandomFixed === 'number' && window.SugarCube && SugarCube.setup) {
      const fixed = window.__twRandomFixed;
      SugarCube.setup.roll = (min, max) => {
        const low = Number(min);
        const high = Number(max);
        if (!Number.isFinite(low) || !Number.isFinite(high)) {
          return 0;
        }
        const roll = Math.floor(fixed * (high - low + 1)) + low;
        if (typeof SugarCube.setup.recordDiceRoll === 'function') {
          SugarCube.setup.recordDiceRoll(low, high, roll);
        }
        return roll;
      };
    }
  });
}

async function mockRandom(page, value = 0.99) {
  await page.addInitScript((fixed) => {
    window.__twRandomFixed = fixed;
    Math.random = () => fixed;
  }, value);
}

async function ensureRunAway(page) {
  const runButton = page.locator('.combat-actions .combat-action', { hasText: /(\brun\b|run away|run,? or do nothing|ignore it and run|ignore it)/i });
  if (await runButton.first().isVisible().catch(() => false)) {
    await runButton.first().click();
    await page.waitForFunction(() => !document.querySelector('.combat-scene'));
    return true;
  }

  const fightButton = page.locator('.combat-actions .combat-action', { hasText: /^fight\b/i });
  if (await fightButton.first().isVisible().catch(() => false)) {
    await page.evaluate(() => {
      const title = window.SugarCube.State.passage && window.SugarCube.State.passage.title;
      if (title && /^\d+$/.test(String(title).trim())) {
        window.SugarCube.State.variables.lastRoom = String(title).trim();
      }
    });
    await fightButton.first().click();
    await page.waitForTimeout(150);
    return ensureRunAway(page);
  }

  const battleOver = page.locator('.combat-actions .combat-action', { hasText: /battle is over/i });
  if (await battleOver.first().isVisible().catch(() => false)) {
    await battleOver.first().click();
    await page.waitForFunction(() => !document.querySelector('.combat-scene'));
    return true;
  }

  const roomFight = page.getByRole('link', { name: /^fight\b/i });
  if (await roomFight.first().isVisible().catch(() => false)) {
    await roomFight.first().click({ force: true });
    const started = await page.waitForSelector('.combat-scene', { timeout: 1500 }).then(() => true).catch(() => false);
    if (!started) {
      await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find((el) => /^fight\b/i.test((el.textContent || '').trim()));
        if (link) {
          link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
      });
      await page.waitForSelector('.combat-scene', { timeout: 1500 }).catch(() => null);
    }
    return ensureRunAway(page);
  }

  return false;
}

async function goDirection(page, directionRegex) {
  await ensureRunAway(page);
  await page.waitForFunction(() => !document.querySelector('.combat-scene'));
  const prevTitle = await page.evaluate(() => (window.SugarCube.State.passage && window.SugarCube.State.passage.title) || '');
  let dirLink = page.locator('.room-actions .room-action', { hasText: directionRegex });
  if (!(await dirLink.first().isVisible().catch(() => false))) {
    dirLink = page.getByRole('link', { name: directionRegex });
  }
  await expect(dirLink.first()).toBeVisible();
  await dirLink.first().click();
  await page.waitForFunction(
    (prev) => window.SugarCube.State.passage && window.SugarCube.State.passage.title !== prev,
    prevTitle,
    { timeout: 2000 }
  );
  await ensureRunAway(page);
}

test('Geemer combat allows repeat actions', async ({ page }) => {
  // Force a miss so the fight continues and the action link appears again.
  await mockRandom(page, 0.99);
  await openStory(page);

  await page.evaluate(() => {
    window.SugarCube.State.variables.combat = 1;
    window.SugarCube.State.variables.lastRoom = '01';
    window.SugarCube.Engine.play('Geemer');
  });

  const attack = page.locator('.combat-actions .combat-action', { hasText: /Normal Beam/i });
  await expect(attack).toBeVisible();
  await attack.click();

  // Allow linkreplace to render and combat UI to refresh
  await page.waitForTimeout(150);

  const attackAgain = page.locator('.combat-actions .combat-action', { hasText: /Normal Beam/i });
  await expect(attackAgain).toBeVisible();
});

test('Geemer combat updates HUD after damage', async ({ page }) => {
  await mockRandom(page, 0.99);
  await openStory(page);

  await page.evaluate(() => {
    window.SugarCube.State.variables.combat = 1;
    window.SugarCube.State.variables.energy = 30;
    window.SugarCube.State.variables.maxEnergy = 30;
    window.SugarCube.Engine.play('Geemer');
  });

  const attack = page.locator('.combat-actions .combat-action', { hasText: /Normal Beam/i });
  await expect(attack).toBeVisible();
  await attack.click();

  await page.waitForTimeout(200);
  const hudEnergy = await page.locator('#samus-energy').innerText();
  expect(hudEnergy).toMatch(/^\d+\/\d+$/);
});

test('Geemer run ends combat', async ({ page }) => {
  await mockRandom(page, 0.99);
  await openStory(page);

  await page.evaluate(() => {
    window.SugarCube.State.variables.combat = 1;
    window.SugarCube.Engine.play('Geemer');
  });

  const run = page.locator('.combat-actions .combat-action', { hasText: /run,? or do nothing/i });
  await expect(run).toBeVisible();
  await run.click();
  await page.waitForFunction(() => !document.querySelector('.combat-scene'), null, { timeout: 2000 });
  const stillInCombat = await page.evaluate(() => !!document.querySelector('.combat-scene'));
  expect(stillInCombat).toBeFalsy();
});

test('Brinstar navigation path supports running away', async ({ page }) => {
  await mockRandom(page, 0.99);
  await openStory(page);

  await page.evaluate(() => {
    const vars = window.SugarCube.State.variables;
    vars.energy = 30;
    vars.maxEnergy = 30;
    vars.displayStats = 1;
    vars.displayMap = 1;
    vars.combat = 0;
    vars.GateOpen = 1;
    window.SugarCube.Engine.play('01');
  });

  await expect(page.locator('.passage').getByText('Room A-1')).toBeVisible();

  for (let i = 0; i < 3; i += 1) {
    await goDirection(page, /north/i);
  }

  for (let i = 0; i < 3; i += 1) {
    await goDirection(page, /west/i);
  }

  for (let i = 0; i < 3; i += 1) {
    await goDirection(page, /south/i);
  }
});
