import { sendConfirmationEmailToReporterAndManager } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告管理システム - 報告送信時の確認メール自動配信', () => {
  // SCEN-204
  test('部長のメールアドレスが未設定のとき、部長への通知処理がエラーになる', async () => {
    const reporterId = 'user_001';
    const reporterEmail = 'engineer@company.com';
    const reporterName = 'Engineer Taro';
    const managerEmail = null;
    const reportContent = {
      yesterday_achievement: 'Completed feature X',
      today_plan: 'Implement feature Y',
      current_issue: 'Database performance issue',
    };
    const sentAtJst = '2024-01-15T09:30:00+09:00';

    const mockEmailSender = jest.fn();

    const input = {
      reporterId,
      reporterEmail,
      reporterName,
      managerEmail,
      reportContent,
      sentAtJst,
      emailSender: mockEmailSender,
    };

    await expect(
      sendConfirmationEmailToReporterAndManager(input)
    ).rejects.toThrow(/部長メールアドレス/);

    expect(mockEmailSender).toHaveBeenCalledTimes(0);
  });
});