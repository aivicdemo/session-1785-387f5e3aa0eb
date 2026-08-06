import { sendConfirmationEmail } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-120
  test('確認メール自動配信機能 - 昨日の実績がnullのとき、メール送信処理が実行されない', () => {
    const mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    const reportData = {
      yesterdayAccomplishment: null,
      todayPlan: '本日の予定テキスト',
      currentIssues: '抱えている課題テキスト',
      userId: 'user-001',
      departmentId: 'dev-dept-001',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const result = sendConfirmationEmail(reportData, mockEmailService);

    expect(result.emailSent).toBe(false);
    expect(result.dataSaved).toBe(false);
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });
});