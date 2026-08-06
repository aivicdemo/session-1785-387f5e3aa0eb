import { sendConfirmationEmailWithManagerValidation } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  test('SCEN-132: 確認メール自動配信機能 - 部長IDがnullのとき、メール送信処理が実行されない', () => {
    // Arrange
    const mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true })
    };

    const reportData = {
      userId: 'user123',
      managerId: null,
      yesterdayAccomplishment: '昨日の実績：プロジェクトA のモジュール実装完了',
      todayPlan: '今日の予定：プロジェクトB の要件定義会議参加',
      currentChallenges: '抱えている課題：プロジェクトC のスケジュール遅延',
      submittedAt: new Date('2024-01-15T09:00:00Z')
    };

    // Act
    const result = sendConfirmationEmailWithManagerValidation(
      reportData,
      mockEmailService
    );

    // Assert
    expect(mockEmailService.send).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      sent: false,
      reason: '部長IDがnullであるため送信スキップ'
    });
  });
});