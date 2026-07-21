import { expect, test } from '@playwright/test';

const uniqueName = 'テスト用AI事業';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('追加・編集・評価・仮説・調査・行動・検索・保存・削除・復元', async ({ page }) => {
  const ideaCard = () => page.locator('.idea-card').filter({ hasText: uniqueName }).first();
  await expect(page.getByRole('heading', { name: '事業アイデア管理' })).toBeVisible();
  await expect(page.getByTestId('idea-grid').locator('.idea-card')).toHaveCount(7);

  await page.getByTestId('add-idea-button').click();
  await page.getByTestId('idea-name-input').fill(uniqueName);
  await page.getByTestId('idea-industry-input').fill('教育・AI');
  await page.getByLabel('優先度').fill('5');
  await page.getByTestId('save-idea-button').click();
  await page.getByLabel('閉じる').click();
  await expect(ideaCard()).toBeVisible();

  await ideaCard().click();
  await page.getByRole('button', { name: '評価', exact: true }).click();
  await page.getByTestId('score-problemSize-5').click();
  await page.getByLabel('課題の大きさの理由').fill('毎週発生し、放置すると機会損失が出るため。');

  await page.getByRole('button', { name: '仮説', exact: true }).click();
  await page.getByRole('button', { name: '仮説を追加' }).click();
  await page.getByTestId('hypothesis-input').fill('個人塾は問い合わせ自動化に月額料金を払う。');

  await page.getByRole('button', { name: '調査記録', exact: true }).click();
  await page.getByRole('button', { name: '記録を追加' }).click();
  await page.getByTestId('research-partner-input').fill('近隣の個人塾');

  await page.getByRole('button', { name: '次にやること', exact: true }).click();
  await page.getByRole('button', { name: '行動を追加' }).click();
  await page.getByTestId('action-title-input').fill('塾長へヒアリングする');
  await page.getByTestId('save-idea-button').click();
  await page.getByLabel('閉じる').click();

  await page.reload();
  await expect(ideaCard()).toBeVisible();
  await page.getByLabel('アイデア検索').fill('テスト用AI');
  await expect(page.getByTestId('idea-grid').locator('.idea-card')).toHaveCount(1);
  await page.getByLabel('アイデア検索').clear();

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('backup-button').click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();

  await ideaCard().click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('delete-idea-button').click();
  await expect(ideaCard()).toHaveCount(0);

  page.on('dialog', (dialog) => dialog.accept());
  await page.getByLabel('バックアップファイル').setInputFiles(backupPath!);
  await expect(ideaCard()).toBeVisible();
});

test('画面に横方向のはみ出しがない', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
