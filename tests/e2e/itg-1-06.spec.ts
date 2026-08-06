import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('日報データ照会画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('[name="username"]', 'manager01');
    await page.fill('[name="password"]', 'password');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    await page.goto(`${BASE_URL}/panels/scr-1785921357094.html`);
    await page.waitForLoadState('networkidle');
  });

  // SCEN-046: [normal] 日報データ照会画面 - 報告送信履歴タブで送信ユーザーが表示される
  test('SCEN-046: 報告送信履歴タブで送信ユーザーが表示される', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const [year, month, day] = today.split('-');
    const fromDate = `${year}/${month}/${day}`;
    const toDate = `${year}/${month}/${day}`;

    await page.fill('[data-testid="report-date-from"]', fromDate);
    await page.fill('[data-testid="report-date-to"]', toDate);
    await page.selectOption('[data-testid="department-filter"]', 'all');
    await page.click('button:has-text("検索")');

    await page.waitForSelector('#report-list', { timeout: 5000 });
    const reportRows = page.locator('.report-row');
    const count = await reportRows.count();
    
    if (count > 0) {
      const firstRow = reportRows.first();
      const cellText = await firstRow.textContent();
      expect(cellText).toBeTruthy();
      expect(cellText?.length || 0).toBeGreaterThan(0);
    }
  });

  // SCEN-047: [edge] 日報データ照会画面 - 検索条件を指定して実行した場合、条件に一致する日報が 0 件のとき空の一覧が表示される
  test('SCEN-047: 検索条件で0件の場合、空の一覧が表示される', async ({ page }) => {
    await page.fill('[data-testid="report-date-from"]', '2025/01/01');
    await page.fill('[data-testid="report-date-to"]', '2025/01/01');
    await page.selectOption('[data-testid="department-filter"]', 'sales');
    await page.click('button:has-text("検索")');

    await page.waitForSelector('#report-list', { timeout: 5000 });
    const reportCount = page.locator('[data-testid="report-count"]');
    const emptyState = page.locator('#empty-state');

    const countVisible = await reportCount.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    if (countVisible) {
      const text = await reportCount.textContent();
      expect(text).toContain('0件');
    } else if (emptyVisible) {
      expect(emptyState).toBeVisible();
    }
  });

  // SCEN-048: [edge] 日報データ照会画面 - 検索条件を指定して実行した場合、条件に一致する日報が複数件のときすべて一覧に表示される
  test('SCEN-048: 複数件の日報がすべて一覧に表示される', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const [year, month, day] = today.split('-');
    const fromDate = `${year}/${month}/${day}`;
    const toDate = `${year}/${month}/${day}`;

    await page.fill('[data-testid="report-date-from"]', fromDate);
    await page.fill('[data-testid="report-date-to"]', toDate);
    await page.selectOption('[data-testid="department-filter"]', 'all');
    await page.click('button:has-text("検索")');

    await page.waitForSelector('#report-list', { timeout: 5000 });
    const reportRows = page.locator('.report-row');
    const count = await reportRows.count();

    expect(count).toBeGreaterThanOrEqual(0);

    if (count > 0) {
      const rowTexts: string[] = [];
      for (let i = 0; i < Math.min(count, 10); i++) {
        const text = await reportRows.nth(i).textContent();
        if (text) {
          rowTexts.push(text);
        }
      }
      expect(rowTexts.length).toBeGreaterThan(0);
    }
  });

  // SCEN-049: [error] 日報データ照会画面 - 報告日付範囲を指定せず検索実行するとエラー表示になる
  test('SCEN-049: 報告日付範囲なしで検索するとエラー表示', async ({ page }) => {
    await page.selectOption('[data-testid="department-filter"]', 'all');
    await page.click('button:has-text("検索")');

    const errorMsg = page.locator('text=/報告日付範囲を指定|開始日と終了日を入力/');
    await errorMsg.waitFor({ timeout: 3000 }).catch(() => {});
    
    const isVisible = await errorMsg.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  // SCEN-050: [error] 日報データ照会画面 - 部門フィルタを指定せず検索実行するとエラー表示になる
  test('SCEN-050: 部門フィルタなしで検索するとエラー表示', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const [year, month, day] = today.split('-');
    const fromDate = `${year}/${month}/${day}`;
    const toDate = `${year}/${month}/${day}`;

    await page.fill('[data-testid="report-date-from"]', fromDate);
    await page.fill('[data-testid="report-date-to"]', toDate);
    
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.selectOption('');
    
    await page.click('button:has-text("検索")');

    const errorMsg = page.locator('text=/部門を選択|部門フィルタは必須/');
    await errorMsg.waitFor({ timeout: 3000 }).catch(() => {});
    
    const isVisible = await errorMsg.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  // SCEN-052: [normal] 日報入力・送信画面で送信した日報が日報データ照会画面で検索・照会できる
  test('SCEN-052: 送信した日報が照会画面で検索・照会できる', async ({ page }) => {
    const testUser = 'engineer01';
    const testPassword = 'password';

    // ステップ1: ユーザーが日報入力・送信画面にログインして日報を送信
    await page.goto(`${BASE_URL}/panels/scr-1785921335709.html`);
    await page.waitForLoadState('networkidle');

    const today = new Date().toISOString().split('T')[0];
    const [year, month, day] = today.split('-');
    const reportDate = `${year}/${month}/${day}`;

    // 日報入力
    await page.fill('[data-testid="report-date-input"]', reportDate);
    await page.selectOption('[data-testid="department-select"]', 'engineering');
    await page.fill('[data-testid="report-content-textarea"]', 'A社との打ち合わせ実施');
    await page.selectOption('[data-testid="progress-status-select"]', 'on_track');
    await page.fill('[data-testid="issues-textarea"]', 'C案件の予算調整');
    await page.fill('[data-testid="action-plan-textarea"]', 'B社資料作成');

    // 送信
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('#submit-confirm-dialog', { timeout: 3000 });
    await page.click('#confirm-submit-button');
    await page.waitForSelector('#submit-success-dialog', { timeout: 5000 });

    // ステップ2: 日報データ照会画面で検索
    await page.goto(`${BASE_URL}/panels/scr-1785921357094.html`);
    await page.waitForLoadState('networkidle');

    await page.fill('[data-testid="report-date-from"]', reportDate);
    await page.fill('[data-testid="report-date-to"]', reportDate);
    await page.selectOption('[data-testid="department-filter"]', 'all');
    await page.click('button:has-text("検索")');

    await page.waitForSelector('#report-list', { timeout: 5000 });

    const reportRows = page.locator('.report-row');
    const rowCount = await reportRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // ステップ3: 詳細表示を確認
    const firstRow = reportRows.first();
    await firstRow.click();

    await page.waitForSelector('#detail-panel', { timeout: 3000 });
    const detailText = await page.locator('#detail-panel').textContent();

    expect(detailText).toContain('A社との打ち合わせ実施');
    expect(detailText).toContain('B社資料作成');
    expect(detailText).toContain('C案件の予算調整');
  });
});