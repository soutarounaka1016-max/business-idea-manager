import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('ChatGPT会話を整理して新しいアイデアへ反映する', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByTestId('chatgpt-sync-button').click();
  await page.getByTestId('conversation-title-input').fill('会話同期テスト');
  await page.getByTestId('conversation-text-input').fill('塾向け予約AIアプリを作りたい。課題は日程調整に時間がかかること。次に塾へ聞き取りする。');
  await page.getByTestId('analyze-conversation-button').click();
  await expect(page.getByTestId('extracted-list')).toBeVisible();
  await page.getByTestId('apply-conversation-button').click();
  await page.getByLabel('閉じる').click();
  await expect(page.locator('.idea-card').filter({ hasText: '塾向け予約AIアプリ' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('最近取り込んだ会話')).toBeVisible();
  await expect(page.getByText('会話同期テスト')).toBeVisible();
});
