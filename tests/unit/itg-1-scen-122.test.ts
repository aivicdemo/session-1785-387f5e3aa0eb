import { validateAndSendReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-122
  test('確認メール自動配信機能 - 今日の予定がnullのとき、メール送信処理が実行されない', () => {
    const mockMailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    const reportData = {
      userId: 'user-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: null,
      challenges: '課題なし',
      sentAt: new Date('2024-01-15T09:30:00Z'),
    };

    validateAndSendReport(reportData, mockMailService);

    expect(mockMailService.send).not.toHaveBeenCalled();
  });
});