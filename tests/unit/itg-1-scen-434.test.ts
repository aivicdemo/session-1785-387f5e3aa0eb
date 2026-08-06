import { sendConfirmationEmailsToSenderAndManager } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-434: [edge] 催促ループ終了判定機能 - 催促試行回数が規定回数未満の時点では催促を継続する
  test('催促試行回数が規定回数未満の場合、催促ループ継続を示す真値を返す', () => {
    const max_retry_attempts = 3;
    const current_attempt_count = 1;
    const sender_id = 'user-001';
    const sender_name = 'エンジニアA';
    const sender_email = 'engineer-a@example.com';
    const manager_id = 'user-manager-001';
    const manager_name = '開発部長B';
    const manager_email = 'manager-b@example.com';
    const report_date = '2024-01-15';
    const yesterday_achievement = '昨日は機能Xの開発を完了した';
    const today_plan = '本日は機能Yのテストを実施する予定';
    const current_issue = '環境構築でトラブルが発生している';
    const submission_timestamp = new Date('2024-01-15T08:30:00Z');

    const result = sendConfirmationEmailsToSenderAndManager(
      {
        sender_id,
        sender_name,
        sender_email,
        manager_id,
        manager_name,
        manager_email,
        report_date,
        yesterday_achievement,
        today_plan,
        current_issue,
        submission_timestamp,
      },
      {
        max_retry_attempts,
        current_attempt_count,
      }
    );

    expect(result.should_continue_retry_loop).toBe(true);
    expect(result.confirmation_emails_sent).toBe(2);
    expect(result.recipient_list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipient_email: sender_email,
          recipient_type: 'sender',
        }),
        expect.objectContaining({
          recipient_email: manager_email,
          recipient_type: 'manager',
        }),
      ])
    );
  });
});