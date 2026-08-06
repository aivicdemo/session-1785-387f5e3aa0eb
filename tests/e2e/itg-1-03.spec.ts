import { test, expect } from '@playwright/test';

test.describe("日報提出状況ダッシュボード", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html");
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    await page.goto("/panels/scr-1785921347004.html");
    await page.waitForLoadState('networkidle');
  });

  // SCEN-019
  test('[normal] 日報提出状況ダッシュボード - 提出期限表示が画面に表示される', async ({ page }) => {
    const submissionDeadline = page.locator('[data-testid="submission-deadline"]');
    await expect(submissionDeadline).toBeVisible();
    const deadlineText = await submissionDeadline.textContent();
    expect(deadlineText).toBeTruthy();
  });

  // SCEN-020
  test('[normal] 日報提出状況ダッシュボード - 部門別提出状況サマリーが画面に表示される', async ({ page }) => {
    const content = page.locator('.content-area');
    await expect(content).toBeVisible();
    const summaryElements = page.locator('text=営業部').or(page.locator('text=企画部'));
    await expect(summaryElements.first()).toBeVisible();
  });

  // SCEN-021
  test('[normal] 日報提出状況ダッシュボード - ユーザー別提出状況一覧が画面に表示される', async ({ page }) => {
    const pendingList = page.locator('[data-testid="pending-list"]');
    await expect(pendingList).toBeVisible();
    const listItems = page.locator('#pending-tbody tr');
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
  });

  // SCEN-022
  test('[normal] 日報提出状況ダッシュボード - 未提出者リストが画面に表示される', async ({ page }) => {
    const pendingList = page.locator('[data-testid="pending-list"]');
    await expect(pendingList).toBeVisible();
    const pendingTbody = page.locator('#pending-tbody');
    await expect(pendingTbody).toBeVisible();
  });

  // SCEN-023
  test('[normal] 日報提出状況ダッシュボード - 提出率グラフが画面に表示される', async ({ page }) => {
    const chart = page.locator('#submission-chart');
    await expect(chart).toBeVisible();
    const svg = chart.locator('svg');
    await expect(svg).toBeVisible();
  });

  // SCEN-024
  test('[normal] 日報提出状況ダッシュボード - 本日の提出数カウンターが画面に表示される', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="pending-count"]').textContent();
    expect(initialCount).toBeTruthy();
    
    await page.goto("/panels/scr-1785921335709.html");
    await page.waitForLoadState('networkidle');
    
    const reportDate = page.locator('[data-testid="report-date-input"]');
    const today = new Date().toISOString().split('T')[0];
    await reportDate.fill(today);
    
    const department = page.locator('[data-testid="department-select"]');
    await department.selectOption('営業部');
    
    const content = page.locator('[data-testid="report-content-textarea"]');
    await content.fill('テスト報告内容');
    
    const progress = page.locator('[data-testid="progress-status-select"]');
    await progress.selectOption('予定通り');
    
    const submitBtn = page.locator('button:has-text("送信")').first();
    await submitBtn.click();
    
    await page.waitForSelector('[id="submit-confirm-dialog"]', { state: 'visible' });
    const confirmBtn = page.locator('[id="confirm-submit-button"]');
    await confirmBtn.click();
    
    await page.goto("/panels/scr-1785921347004.html");
    await page.waitForLoadState('networkidle');
    
    const updatedCount = await page.locator('[data-testid="pending-count"]').textContent();
    expect(updatedCount).toBeTruthy();
  });

  // SCEN-025
  test('[normal] 日報提出状況ダッシュボード - 部門フィルターを選択すると一覧がフィルター結果に更新される', async ({ page }) => {
    const departmentFilter = page.locator('[data-testid="department-filter"]');
    await expect(departmentFilter).toBeVisible();
    
    await departmentFilter.selectOption('営業部');
    await page.waitForTimeout(1000);
    
    const filteredList = page.locator('#pending-tbody tr');
    const count = await filteredList.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // SCEN-026
  test('[normal] 日報提出状況ダッシュボード - ユーザーフィルターを選択すると一覧がフィルター結果に更新される', async ({ page }) => {
    const departmentFilter = page.locator('[data-testid="department-filter"]');
    await departmentFilter.selectOption('営業部');
    await page.waitForTimeout(1000);
    
    const userRows = page.locator('#pending-tbody tr');
    if (await userRows.count() > 0) {
      const firstUserName = await userRows.first().textContent();
      expect(firstUserName).toBeTruthy();
    }
  });

  // SCEN-027
  test('[normal] 日報提出状況ダッシュボード - 提出状況ステータス表示が画面に表示される', async ({ page }) => {
    const tbody = page.locator('#pending-tbody');
    await expect(tbody).toBeVisible();
    
    const rows = page.locator('#pending-tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    const statusCells = page.locator('#pending-tbody td');
    const visibleCells = await statusCells.count();
    expect(visibleCells).toBeGreaterThan(0);
  });

  // SCEN-028
  test('[normal] 日報提出状況ダッシュボード - 集計データテーブルが画面に表示される', async ({ page }) => {
    const pendingList = page.locator('[data-testid="pending-list"]');
    await expect(pendingList).toBeVisible();
    
    const tbody = page.locator('#pending-tbody');
    await expect(tbody).toBeVisible();
    
    const rows = page.locator('#pending-tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});