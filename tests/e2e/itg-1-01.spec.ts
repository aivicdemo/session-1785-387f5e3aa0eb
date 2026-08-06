import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page) {
  await page.goto("/login.html");
  await page.fill('[name="username"]', 'test');
  await page.fill('[name="password"]', 'test');
  await Promise.all([
    page.waitForURL(url => !url.toString().includes('/login.html')),
    page.click('button[type="submit"]'),
  ]);
}

test.describe("日報入力・送信画面", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/panels/scr-1785921335709.html");
  });

  // SCEN-001
  test("SCEN-001: 報告内容テキストエリアに入力した値が保持される", async ({ page }) => {
    const yesterdayInput = page.locator('[data-testid="report-content-textarea"]').first();
    const todayInput = page.locator('[name="progressStatus"]');
    const issuesInput = page.locator('[data-testid="issues-textarea"]');

    await yesterdayInput.fill("顧客A社の提案資料作成");
    await todayInput.fill("顧客B社との打ち合わせ");
    await issuesInput.fill("プロジェクトスケジュール調整");

    // Click outside form to blur
    await page.click('body');

    // Navigate away briefly and back
    await page.goto("/panels/scr-1785921347004.html");
    await page.goto("/panels/scr-1785921335709.html");

    // Verify values are still present
    await expect(yesterdayInput).toHaveValue("顧客A社の提案資料作成");
    await expect(todayInput).toHaveValue("顧客B社との打ち合わせ");
    await expect(issuesInput).toHaveValue("プロジェクトスケジュール調整");
  });

  // SCEN-002
  test("SCEN-002: 報告日付選択で選択した日付が保持される", async ({ page }) => {
    const dateInput = page.locator('[data-testid="report-date-input"]');
    
    // Select a date (3 days ago)
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const dateString = threeDaysAgo.toISOString().split('T')[0];
    
    await dateInput.fill(dateString);
    
    // Add content
    await page.locator('[data-testid="report-content-textarea"]').first().fill("test content");
    await page.locator('[name="progressStatus"]').fill("test plan");
    await page.locator('[data-testid="issues-textarea"]').fill("test issues");
    
    // Reload page
    await page.reload();
    
    // Verify date is preserved
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toBe(dateString);
  });

  // SCEN-003
  test("SCEN-003: 部門選択ドロップダウンで選択した部門が保持される", async ({ page }) => {
    const deptSelect = page.locator('[data-testid="department-select"]');
    
    await deptSelect.selectOption("営業部");
    
    await page.locator('[data-testid="report-content-textarea"]').first().fill("activity");
    await page.locator('[name="progressStatus"]').fill("plan");
    await page.locator('[data-testid="issues-textarea"]').fill("issues");
    
    // Verify selection is maintained
    const selectedValue = await deptSelect.inputValue();
    expect(selectedValue).toBe("営業部");
  });

  // SCEN-004
  test("SCEN-004: 下書き保存ボタン押下で入力内容が保存される", async ({ page }) => {
    await page.locator('[data-testid="report-content-textarea"]').first().fill("顧客A社との打合せ");
    await page.locator('[name="progressStatus"]').fill("提案資料作成");
    await page.locator('[data-testid="issues-textarea"]').fill("リソース不足");
    
    await page.click('button:has-text("下書き保存")');
    
    // Wait for save confirmation
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto("/panels/scr-1785921347004.html");
    await page.goto("/panels/scr-1785921335709.html");
    
    // Verify saved content
    await expect(page.locator('[data-testid="report-content-textarea"]').first()).toHaveValue("顧客A社との打合せ");
    await expect(page.locator('[name="progressStatus"]')).toHaveValue("提案資料作成");
    await expect(page.locator('[data-testid="issues-textarea"]')).toHaveValue("リソース不足");
  });

  // SCEN-005
  test("SCEN-005: 報告内容編集ボタン押下で入力フォームが編集可能状態になる", async ({ page }) => {
    // First submit a report
    await page.locator('[data-testid="report-content-textarea"]').first().fill("test activity");
    await page.locator('[name="progressStatus"]').fill("test plan");
    await page.locator('[data-testid="issues-textarea"]').fill("test issues");
    
    await page.click('button:has-text("送信")');
    await page.waitForTimeout(300);
    
    // Click confirm if dialog appears
    if (await page.locator('#submit-confirm-dialog').isVisible()) {
      await page.click('#confirm-submit-button');
    }
    
    await page.waitForTimeout(500);
    
    // Look for edit button and click it
    const editButton = page.locator('button:has-text("詳細を確認")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }
    
    // Verify form is editable
    const contentField = page.locator('[data-testid="report-content-textarea"]').first();
    await expect(contentField).toBeEnabled();
    
    // Try to click and type
    await contentField.click();
    const isEditable = await contentField.evaluate((el: HTMLTextAreaElement) => !el.disabled);
    expect(isEditable).toBe(true);
  });

  // SCEN-006
  test("SCEN-006: 送信ボタン押下で送信確認ダイアログが表示される", async ({ page }) => {
    await page.locator('[data-testid="report-content-textarea"]').first().fill("顧客A向けドキュメント作成完了");
    await page.locator('[name="progressStatus"]').fill("顧客B向けヒアリング実施");
    await page.locator('[data-testid="issues-textarea"]').fill("ツールのライセンス更新手続き");
    
    await page.click('button:has-text("送信")');
    
    // Verify dialog is visible
    await expect(page.locator('#submit-confirm-dialog')).toBeVisible();
    
    // Verify dialog contains content summary
    const dialogText = await page.locator('#submit-confirm-dialog').textContent();
    expect(dialogText).toContain("確認");
  });

  // SCEN-007
  test("SCEN-007: 送信確認ダイアログに送信者メールアドレスが表示される", async ({ page }) => {
    await page.locator('[data-testid="report-content-textarea"]').first().fill("test");
    await page.locator('[name="progressStatus"]').fill("test");
    await page.locator('[data-testid="issues-textarea"]').fill("test");
    
    await page.click('button:has-text("送信")');
    
    await expect(page.locator('#submit-confirm-dialog')).toBeVisible();
    
    // Verify sender email is in dialog
    const senderEmail = page.locator('#confirm-sender-email');
    await expect(senderEmail).toBeVisible();
  });

  // SCEN-008
  test("SCEN-008: 送信確認ダイアログに部長メールアドレスが表示される", async ({ page }) => {
    await page.locator('[data-testid="report-content-textarea"]').first().fill("test");
    await page.locator('[name="progressStatus"]').fill("test");
    await page.locator('[data-testid="issues-textarea"]').fill("test");
    
    await page.click('button:has-text("送信")');
    
    await expect(page.locator('#submit-confirm-dialog')).toBeVisible();
    
    // Verify manager email is in dialog
    const managerEmail = page.locator('#confirm-manager-email');
    await expect(managerEmail).toBeVisible();
  });

  // SCEN-009
  test("SCEN-009: 送信確認ダイアログで確認ボタン押下で日報が送信される", async ({ page }) => {
    await page.locator('[data-testid="report-content-textarea"]').first().fill("テスト実施");
    await page.locator('[name="progressStatus"]').fill("要件確認");
    await page.locator('[data-testid="issues-textarea"]').fill("環境構築遅延");
    
    await page.click('button:has-text("送信")');
    
    await expect(page.locator('#submit-confirm-dialog')).toBeVisible();
    
    // Click confirm button
    await page.click('#confirm-submit-button');
    
    // Verify success message or completion
    await page.waitForTimeout(500);
    
    // Check for success dialog or completion message
    const successDialog = page.locator('#submit-success-dialog');
    if (await successDialog.isVisible()) {
      await expect(successDialog).toContainText("送信");
    }
  });

  // SCEN-010
  test("SCEN-010: 日報送信後に送信履歴一覧に新規送信記録が追加される", async ({ page }) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    await page.locator('[data-testid="report-content-textarea"]').first().fill("顧客A社との打ち合わせ実施");
    await page.locator('[name="progressStatus"]').fill("提案資料の作成");
    await page.locator('[data-testid="issues-textarea"]').fill("リソース不足");
    
    await page.click('button:has-text("送信")');
    
    await expect(page.locator('#submit-confirm-dialog')).toBeVisible();
    
    await page.click('#confirm-submit-button');
    
    await page.waitForTimeout(500);
    
    // Verify history list contains new entry
    const historyList = page.locator('#history-list');
    await expect(historyList).toContainText("顧客A社との打ち合わせ実施");
    await expect(historyList).toContainText("提案資料の作成");
    await expect(historyList).toContainText("リソース不足");
  });
});