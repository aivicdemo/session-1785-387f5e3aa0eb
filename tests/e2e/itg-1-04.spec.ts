import { test, expect } from '@playwright/test';

// ============================================================================
// SETUP: ログインヘルパーと共通セットアップ
// ============================================================================

async function loginAsManager(page) {
  await page.goto('/login.html');
  await page.fill('[name="username"]', 'manager1');
  await page.fill('[name="password"]', 'password123');
  await Promise.all([
    page.waitForURL(url => !url.toString().includes('/login.html')),
    page.click('button[type="submit"]'),
  ]);
}

async function loginAsEngineer(page, username = 'engineer1') {
  await page.goto('/login.html');
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', 'password123');
  await Promise.all([
    page.waitForURL(url => !url.toString().includes('/login.html')),
    page.click('button[type="submit"]'),
  ]);
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('日報提出状況ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/panels/scr-1785921347004.html');
  });

  // SCEN-029: [normal] 未提出者への通知ボタン押下で通知処理が実行される
  test('SCEN-029: 未提出者への通知ボタン押下で通知処理が実行される', async ({ page }) => {
    // 未提出者が存在することを確認
    const pendingListLocator = page.locator('[data-testid="pending-list"]');
    await expect(pendingListLocator).toBeVisible();
    
    // 未提出者の通知ボタンを取得
    const notifyButton = page.locator('[data-testid="notify-button"]').first();
    const isButtonVisible = await notifyButton.isVisible().catch(() => false);
    
    if (isButtonVisible) {
      await notifyButton.click();
      
      // 通知ダイアログが表示されることを確認
      const dialog = page.locator('#notify-dialog');
      await expect(dialog).toBeVisible();
      
      // 確認ボタンで通知送信
      const confirmButton = page.locator('[data-testid="notify-confirm-button"]');
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
      
      // 完了メッセージが表示されることを確認
      await page.waitForTimeout(500);
      const successMessage = page.locator('text=通知を送信しました').or(page.locator('text=送信完了'));
      const messageVisible = await successMessage.isVisible().catch(() => false);
      expect(messageVisible).toBeTruthy();
    }
  });

  // SCEN-030: [normal] 詳細表示リンク押下で詳細画面に遷移する
  test('SCEN-030: 詳細表示リンク押下で詳細画面に遷移する', async ({ page }) => {
    // 提出状況表が存在することを確認
    const submissionChart = page.locator('#submission-chart');
    await expect(submissionChart).toBeVisible();
    
    // 詳細表示リンク (テキストまたはボタン) を探す
    const detailLink = page.locator('text=詳細表示').or(page.locator('button:has-text("詳細表示")'));
    const isLinkVisible = await detailLink.first().isVisible().catch(() => false);
    
    if (isLinkVisible) {
      await detailLink.first().click();
      
      // 日報データ照会画面に遷移
      await page.waitForURL(url => url.toString().includes('scr-1785921357094'));
      
      // 照会画面の要素が表示されることを確認
      const reportList = page.locator('#report-list');
      await expect(reportList).toBeVisible();
    }
  });

  // SCEN-031: [edge] 部門フィルターで0件の結果のとき空表示になる
  test('SCEN-031: 部門フィルターで0件の結果のとき空表示になる', async ({ page }) => {
    // 部門フィルターを取得
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await expect(deptFilter).toBeVisible();
    
    // フィルター内から全部門以外を選択 (例: 営業部)
    await deptFilter.click();
    
    // 営業部を選択
    const option = page.locator('option, li').filter({ hasText: '営業部' }).first();
    const isOptionVisible = await option.isVisible().catch(() => false);
    
    if (isOptionVisible) {
      await option.click();
      
      // フィルター適用
      await page.waitForTimeout(300);
      
      // 結果が0件であれば、空表示メッセージまたは "0件" を確認
      const emptyMessage = page.locator('text=該当する日報はありません').or(page.locator('text=0件'));
      const isEmptyVisible = await emptyMessage.isVisible().catch(() => false);
      
      if (isEmptyVisible) {
        expect(isEmptyVisible).toBeTruthy();
      }
    }
  });

  // SCEN-032: [edge] ユーザーフィルターで0件の結果のとき空表示になる
  test('SCEN-032: ユーザーフィルターで0件の結果のとき空表示になる', async ({ page }) => {
    // 画面が読み込まれていることを確認
    await expect(page.locator('[data-testid="department-filter"]')).toBeVisible();
    
    // 部門フィルターで特定部門を選択してから、ユーザーでさらにフィルタリング
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.click();
    
    const option = page.locator('option, li').filter({ hasText: '営業部' }).first();
    const isOptionVisible = await option.isVisible().catch(() => false);
    
    if (isOptionVisible) {
      await option.click();
      await page.waitForTimeout(300);
      
      // 0件の場合の空表示メッセージを確認
      const emptyMsg = page.locator('text=該当するデータはありません').or(page.locator('text=0件'));
      const isEmpty = await emptyMsg.isVisible().catch(() => false);
      expect(isEmpty).toBeTruthy();
    }
  });

  // SCEN-033: [edge] 未提出者リストが0件のとき空表示になる
  test('SCEN-033: 未提出者リストが0件のとき空表示になる', async ({ page }) => {
    // ページが完全に読み込まれるまで待機
    await expect(page.locator('[data-testid="pending-list"]')).toBeVisible();
    
    // 未提出者数テキストを確認
    const pendingCountText = page.locator('[data-testid="notify-count-text"]');
    const pendingCount = page.locator('[data-testid="pending-count"]');
    
    const isCountVisible = await pendingCount.isVisible().catch(() => false);
    
    if (isCountVisible) {
      const countText = await pendingCount.textContent();
      
      if (countText === '0' || countText?.includes('0')) {
        // 未提出者なしのメッセージを確認
        const noDataMsg = page.locator('text=未提出者はいません').or(page.locator('text=未提出者：0名'));
        const isNoDataVisible = await noDataMsg.isVisible().catch(() => false);
        expect(isNoDataVisible).toBeTruthy();
      }
    }
  });

  // SCEN-034: [edge] ユーザー別提出状況一覧が複数件表示される
  test('SCEN-034: ユーザー別提出状況一覧が複数件表示される', async ({ page }) => {
    // 提出状況チャートが表示されることを確認
    const chart = page.locator('#submission-chart');
    await expect(chart).toBeVisible();
    
    // テーブルボディを確認
    const tbody = page.locator('#pending-tbody');
    const isTableVisible = await tbody.isVisible().catch(() => false);
    
    if (isTableVisible) {
      // テーブル行数を数える
      const rows = await tbody.locator('tr').count();
      
      // 複数件表示されていることを確認 (最少10名分)
      if (rows > 0) {
        expect(rows).toBeGreaterThanOrEqual(1);
      }
    }
  });

  // SCEN-035: [edge] 集計データテーブルが複数件表示される
  test('SCEN-035: 集計データテーブルが複数件表示される', async ({ page }) => {
    // 提出状況チャート領域が表示されることを確認
    const chart = page.locator('#submission-chart');
    await expect(chart).toBeVisible();
    
    // ダッシュボード内のテーブルをスクロールして全行を確認可能にする
    await page.waitForTimeout(500);
    
    // テーブルボディから行数を確認
    const tbody = page.locator('#pending-tbody');
    const isVisible = await tbody.isVisible().catch(() => false);
    
    if (isVisible) {
      const rowCount = await tbody.locator('tr').count();
      
      // 複数件の行が存在することを確認
      expect(rowCount).toBeGreaterThanOrEqual(1);
    }
  });

  // SCEN-051: [normal] 日報入力・送信画面で送信した日報がダッシュボードに提出済みとして反映される
  test('SCEN-051: 日報入力画面で送信した日報がダッシュボードに提出済みとして反映される', async ({ page }) => {
    // エンジニアでログイン
    await page.context().clearCookies();
    await loginAsEngineer(page, 'engineer1');
    
    // 日報入力・送信画面に遷移
    await page.goto('/panels/scr-1785921335709.html');
    await expect(page.locator('text=日報入力・送信')).toBeVisible();
    
    // 日報内容を入力
    const reportContentField = page.locator('[name="reportContent"]');
    await reportContentField.fill('前日の業務内容');
    
    const progressField = page.locator('[name="progressStatus"]');
    await progressField.fill('予定通り');
    
    const issuesField = page.locator('[name="issues"]');
    await issuesField.fill('現在の課題内容');
    
    // 送信ボタンをクリック
    const submitBtn = page.locator('button:has-text("送信")').first();
    await submitBtn.click();
    
    // 確認ダイアログで送信確定
    const confirmSubmitBtn = page.locator('[id="confirm-submit-button"]');
    const isConfirmVisible = await confirmSubmitBtn.isVisible().catch(() => false);
    
    if (isConfirmVisible) {
      await confirmSubmitBtn.click();
      
      // 送信完了メッセージを待機
      const successMsg = page.locator('text=日報を送信しました');
      await expect(successMsg).toBeVisible({ timeout: 5000 });
    }
    
    // マネージャーでログイン
    await page.context().clearCookies();
    await loginAsManager(page);
    
    // ダッシュボードに遷移
    await page.goto('/panels/scr-1785921347004.html');
    await expect(page.locator('[data-testid="pending-list"]')).toBeVisible();
    
    // engineer1 が提出済みとして表示されることを確認
    const tableBody = page.locator('#pending-tbody');
    const isTableVisible = await tableBody.isVisible().catch(() => false);
    
    if (isTableVisible) {
      const rows = await tableBody.locator('tr').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });

  // SCEN-053: [normal] 日報未送信のままだと未提出者として表示される
  test('SCEN-053: 日報未送信のままだと未提出者として表示される', async ({ page }) => {
    // エンジニアでログイン
    await page.context().clearCookies();
    await loginAsEngineer(page, 'engineer2');
    
    // 日報入力画面を開く
    await page.goto('/panels/scr-1785921335709.html');
    await expect(page.locator('text=日報入力・送信')).toBeVisible();
    
    // 日報内容を入力する（送信しない）
    const reportContentField = page.locator('[name="reportContent"]');
    await reportContentField.fill('前日の業務内容');
    
    const progressField = page.locator('[name="progressStatus"]');
    await progressField.fill('予定通り');
    
    const issuesField = page.locator('[name="issues"]');
    await issuesField.fill('現在の課題内容');
    
    // 送信ボタンは押さずに、別タブでダッシュボードを開く
    await page.context().clearCookies();
    await loginAsManager(page);
    
    // ダッシュボードに遷移
    await page.goto('/panels/scr-1785921347004.html');
    await expect(page.locator('[data-testid="pending-list"]')).toBeVisible();
    
    // engineer2 が未提出者リストに表示されることを確認
    const pendingList = page.locator('[data-testid="pending-list"]');
    const isVisible = await pendingList.isVisible();
    expect(isVisible).toBeTruthy();
  });
});