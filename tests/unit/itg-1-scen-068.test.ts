import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmail } from '../../src/logic/it-2';

describe('送信時の自動確認メール通知', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // SCEN-068
  test('確認メール自動配信機能 - 送信者のメールアドレスが空文字のときエラーとなる', () => {
    const sender_email = '';
    const report_content = {
      yesterday_achievement: '昨日は機能A の実装を完了しました',
      today_plan: '本日は機能B の設計ドキュメントを作成します',
      current_issues: '設計ドキュメント作成時間が予定より長くなる可能性があります'
    };
    const recipient_email = 'manager@example.com';

    const result = sendConfirmationEmail({
      sender_email: sender_email,
      report_content: report_content,
      recipient_email: recipient_email
    });

    expect(result.success).toBe(false);
    expect(result.error_message).toMatch(/送信者メールアドレス/);
    expect(consoleSpy).toHaveBeenCalled();
    const error_log = consoleSpy.mock.calls[0][0];
    expect(error_log).toMatch(/送信者メールアドレス/);
    expect(error_log).toMatch(/空文字/);
    expect(error_log).toMatch(/中断/);
    expect(result.email_sent).toBe(false);
  });
});