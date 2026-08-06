import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('日報入力・送信画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    await page.goto(`${BASE_URL}/panels/scr-1785921335709.html`);
  });

  // SCEN-011
  test('送信履歴一覧に送信日時が表示される', async ({ page }) => {
    const reportContent = `昨日やったこと\nテストタスク実施`;
    const reportPlan = `今日やること\n新機能開発`;
    const reportIssue = `抱えている課題\n環境構築`;

    await page.fill('[name="reportContent"]', reportContent);
    await page.fill('[name="reportPlan"]', reportPlan);
    await page.fill('[name="reportIssue"]', reportIssue);

    await page.click('button:has-text("送信")');
    await page.click('#confirm-submit-button');

    await page.waitForSelector('#submit-success-dialog', { timeout: 5000 });
    await expect(page.locator('#submit-success-dialog')).toBeVisible();

    await page.click('button:has-text("送信完了")');

    const historyList = page.locator('#history-list');
    await expect(historyList).toContainText(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
  });

  // SCEN-012
  test('報告内容を空で送信するとエラーメッセージが表示される', async ({ page }) => {
    await page.click('button:has-text("送信")');

    await page.waitForSelector('#error-dialog', { timeout: 5000 });
    await expect(page.locator('#error-dialog')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText(/報告内容を入力してください/);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/panels/scr-1785921335709.html');
  });

  // SCEN-013
  test('報告日付を未選択で送信するとエラーメッセージが表示される', async ({ page }) => {
    await page.fill('[name="reportContent"]', 'タスクA完了');
    await page.fill('[name="reportPlan"]', 'タスクB開始');
    await page.fill('[name="reportIssue"]', '課題1対応中');

    await page.click('button:has-text("送信")');

    await page.waitForSelector('#error-dialog', { timeout: 5000 });
    await expect(page.locator('#error-dialog')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText(/報告日付を選択してください/);

    expect(page.locator('[name="reportContent"]')).toHaveValue(/タスクA完了/);
    expect(page.locator('[name="reportPlan"]')).toHaveValue(/タスクB開始/);
    expect(page.locator('[name="reportIssue"]')).toHaveValue(/課題1対応中/);
  });

  // SCEN-014
  test('部門を未選択で送信するとエラーメッセージが表示される', async ({ page }) => {
    await page.fill('[name="reportContent"]', '顧客A訪問');
    await page.fill('[name="reportPlan"]', '提案資料作成');
    await page.fill('[name="reportIssue"]', 'リソース不足');

    await page.click('button:has-text("送信")');

    await page.waitForSelector('#error-dialog', { timeout: 5000 });
    await expect(page.locator('#error-dialog')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText(/部門を選択してください/);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/panels/scr-1785921335709.html');
  });

  // SCEN-015
  test('送信履歴が0件のとき空表示になる', async ({ page }) => {
    const historyList = page.locator('#history-list');
    await expect(historyList).toContainText(/送信履歴はありません/);
  });

  // SCEN-016
  test('送信履歴が複数件のとき全件が一覧に表示される', async ({ page }) => {
    const fillAndSubmit = async (content: string, plan: string, issue: string) => {
      await page.fill('[name="reportContent"]', content);
      await page.fill('[name="reportPlan"]', plan);
      await page.fill('[name="reportIssue"]', issue);
      await page.click('button:has-text("送信")');
      await page.click('#confirm-submit-button');
      await page.waitForSelector('#submit-success-dialog', { timeout: 5000 });
      await page.click('button:has-text("送信完了")');
      await page.waitForTimeout(500);
    };

    await fillAndSubmit('実績1', '予定1', '課題1');
    await fillAndSubmit('実績2', '予定2', '課題2');
    await fillAndSubmit('実績3', '予定3', '課題3');

    const historyList = page.locator('#history-list');
    const items = historyList.locator('li');
    await expect(items).toHaveCount(3);
    await expect(historyList).toContainText(/実績1/);
    await expect(historyList).toContainText(/実績2/);
    await expect(historyList).toContainText(/実績3/);
  });

  // SCEN-017
  test('送信確認ダイアログでキャンセルボタン押下でダイアログが閉じる', async ({ page }) => {
    await page.fill('[name="reportContent"]', 'テスト実績');
    await page.fill('[name="reportPlan"]', 'テスト予定');
    await page.fill('[name="reportIssue"]', 'テスト課題');

    await page.click('button:has-text("送信")');
    await page.waitForSelector('#submit-confirm-dialog', { timeout: 5000 });
    await expect(page.locator('#submit-confirm-dialog')).toBeVisible();

    await page.click('#confirm-cancel-button');
    await expect(page.locator('#submit-confirm-dialog')).not.toBeVisible();

    expect(page.locator('[name="reportContent"]')).toHaveValue(/テスト実績/);
    expect(page.locator('[name="reportPlan"]')).toHaveValue(/テスト予定/);
    expect(page.locator('[name="reportIssue"]')).toHaveValue(/テスト課題/);
  });

  // SCEN-018
  test('送信確認ダイアログをキャンセルしても入力内容は破棄されない', async ({ page }) => {
    await page.fill('[name="reportContent"]', '顧客A社との打ち合わせ');
    await page.fill('[name="reportPlan"]', '提案資料の作成');
    await page.fill('[name="reportIssue"]', 'リソース不足');

    await page.click('button:has-text("送信")');
    await page.waitForSelector('#submit-confirm-dialog', { timeout: 5000 });

    await page.click('#confirm-cancel-button');
    await expect(page.locator('#submit-confirm-dialog')).not.toBeVisible();

    await expect(page.locator('[name="reportContent"]')).toHaveValue('顧客A社との打ち合わせ');
    await expect(page.locator('[name="reportPlan"]')).toHaveValue('提案資料の作成');
    await expect(page.locator('[name="reportIssue"]')).toHaveValue('リソース不足');
  });
});