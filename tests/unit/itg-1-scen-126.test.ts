import { sendConfirmationEmail } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-126
  test('確認メール自動配信機能 - 送信者のメールアドレスがnullのとき、メール送信処理が実行されない', () => {
    const sendMailMock = jest.fn();
    
    const reportData = {
      userId: 'user-001',
      senderEmail: null,
      yesterdayAccomplishment: '前日の実績',
      todayPlan: '本日の予定',
      currentIssues: '抱えている課題',
      submittedAt: new Date('2024-01-15T09:30:00Z')
    };

    sendConfirmationEmail(reportData, sendMailMock);

    expect(sendMailMock).not.toHaveBeenCalled();
  });
});