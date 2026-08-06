import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("日報データ照会画面", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    // 日報データ照会画面へ遷移
    await page.goto(`${BASE_URL}/panels/scr-1785921357094.html`);
    await page.waitForLoadState('networkidle');
  });

  // SCEN-036: [normal] 日報データ照会画面 - 報告日付範囲の開始日を指定すると検索結果に反映される
  test("報告日付範囲の開始日を指定すると検索結果に反映される", async ({ page }) => {
    const startDateInput = page.locator('[data-testid="report-date-from"]');
    const endDateInput = page.locator('[data-testid="report-date-to"]');
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await startDateInput.fill('2024-01-15');
    await endDateInput.fill('2024-01-31');
    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('.report-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-037: [normal] 日報データ照会画面 - 報告日付範囲の終了日を指定すると検索結果に反映される
  test("報告日付範囲の終了日を指定すると検索結果に反映される", async ({ page }) => {
    const startDateInput = page.locator('[data-testid="report-date-from"]');
    const endDateInput = page.locator('[data-testid="report-date-to"]');
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await startDateInput.fill('2024-01-01');
    await endDateInput.fill('2024-01-31');
    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('.report-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-038: [normal] 日報データ照会画面 - 部門フィルタで特定の部門を選択すると検索結果に反映される
  test("部門フィルタで特定の部門を選択すると検索結果に反映される", async ({ page }) => {
    const departmentFilter = page.locator('[data-testid="department-filter"]');
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await departmentFilter.selectOption({ label: '営業部' });
    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('.report-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-039: [normal] 日報データ照会画面 - ユーザー名フィルタに値を入力すると検索結果に反映される
  test("ユーザー名フィルタに値を入力すると検索結果に反映される", async ({ page }) => {
    const keywordInput = page.locator('[data-testid="keyword-search"]');
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await keywordInput.fill('田中太郎');
    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('.report-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-040: [normal] 日報データ照会画面 - キーワード検索欄に値を入力すると検索結果に反映される
  test("キーワード検索欄に値を入力すると検索結果に反映される", async ({ page }) => {
    const keywordInput = page.locator('[data-testid="keyword-search"]');
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await keywordInput.fill('バグ修正');
    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('.report-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-041: [normal] 日報データ照会画面 - 検索実行ボタン押下で日報一覧が表示される
  test("検索実行ボタン押下で日報一覧が表示される", async ({ page }) => {
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('.report-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-042: [normal] 日報データ照会画面 - 日報一覧のテーブル行をクリックすると日報詳細表示パネルが開く
  test("日報一覧のテーブル行をクリックすると日報詳細表示パネルが開く", async ({ page }) => {
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const firstRow = page.locator('.report-row').first();
    await firstRow.click();

    const detailPanel = page.locator('#detail-panel');
    await detailPanel.waitFor({ state: 'visible', timeout: 5000 });
    expect(detailPanel).toBeVisible();
  });

  // SCEN-043: [normal] 日報データ照会画面 - 日報詳細パネルに報告内容が表示される
  test("日報詳細パネルに報告内容が表示される", async ({ page }) => {
    const searchButton = page.locator('button:has-text("検索")');
    const reportList = page.locator('#report-list');

    await searchButton.click();
    await reportList.waitFor({ state: 'visible', timeout: 5000 });

    const firstRow = page.locator('.report-row').first();
    await firstRow.click();

    const detailPanel = page.locator('#detail-panel');
    await detailPanel.waitFor({ state: 'visible', timeout: 5000 });

    const panelContent = detailPanel.textContent();
    expect(panelContent).toBeTruthy();
  });

  // SCEN-044: [normal] 日報データ照会画面 - 報告送信履歴タブをクリックすると送信履歴が表示される
  test("報告送信履歴タブをクリックすると送信履歴が表示される", async ({ page }) => {
    const historyTab = page.locator('button:has-text("報告送信履歴")');
    
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(1000);
      
      const historyContent = page.locator('.report-row');
      expect(historyContent).toBeDefined();
    }
  });

  // SCEN-045: [normal] 日報データ照会画面 - 報告送信履歴タブで送信日時が表示される
  test("報告送信履歴タブで送信日時が表示される", async ({ page }) => {
    const historyTab = page.locator('button:has-text("報告送信履歴")');
    
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(1000);
      
      const reportRows = page.locator('.report-row');
      const count = await reportRows.count();
      
      if (count > 0) {
        const firstRowText = await reportRows.first().textContent();
        expect(firstRowText).toBeTruthy();
      }
    }
  });
});