import { sendConfirmationEmail } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-129
  test('確認メール自動配信機能 - 送信者IDが空文字列のとき、メール送信処理が実行されない', () => {
    const mockEmailService = {
      send: jest.fn(),
    };

    const senderID = '';
    const recipientEmail = 'manager@example.com';
    const yesterdayAccomplishment = '昨日はバグ修正を完了しました';
    const todayPlan = '本日はテスト実装を進めます';
    const currentIssue = 'API仕様の確認待ちです';

    const result = sendConfirmationEmail(
      {
        senderID,
        recipientEmail,
        yesterdayAccomplishment,
        todayPlan,
        currentIssue,
      },
      mockEmailService
    );

    expect(mockEmailService.send).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/送信者ID/);
  });
});