import { submitDailyReport } from '../../src/logic/it-1';

describe('朝会報告送信制御機能', () => {
  test('SCEN-144: 同一ユーザーが異なる日付で送信を試みた場合に送信が許可される', () => {
    // === Setup ===
    const userId = 'user_A';
    const date_jan10 = '2024-01-10';
    const date_jan11 = '2024-01-11';

    const report_jan10 = {
      userId: userId,
      reportDate: date_jan10,
      yesterday: 'タスクA完了',
      today: 'タスクB開始',
      issues: '課題なし',
    };

    const report_jan11 = {
      userId: userId,
      reportDate: date_jan11,
      yesterday: 'タスクB進行中',
      today: 'タスクC開始',
      issues: '環境構築の遅延',
    };

    // === First submission on 2024-01-10 ===
    const result_jan10 = submitDailyReport(report_jan10);

    expect(result_jan10.success).toBe(true);
    expect(result_jan10.reportDate).toBe(date_jan10);
    expect(result_jan10.userId).toBe(userId);
    expect(result_jan10.message).toMatch(/送信完了/);
    expect(result_jan10.emailNotified).toBe(true);

    // === Second submission on 2024-01-11 (different date, same user) ===
    const result_jan11 = submitDailyReport(report_jan11);

    expect(result_jan11.success).toBe(true);
    expect(result_jan11.reportDate).toBe(date_jan11);
    expect(result_jan11.userId).toBe(userId);
    expect(result_jan11.message).toMatch(/送信完了/);
    expect(result_jan11.emailNotified).toBe(true);

    // === Verify both submissions are distinct and both succeeded ===
    expect(result_jan10.reportDate).not.toBe(result_jan11.reportDate);
    expect(result_jan10.submissionId).not.toBe(result_jan11.submissionId);
  });
});