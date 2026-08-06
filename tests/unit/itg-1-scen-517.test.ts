import { sendUrgentNotificationEmailsForMissingReports } from '../../src/logic/it-1-br-1-1-1';

describe('未報告催促メール通知機能 - メールアドレス空文字列時の処理', () => {
  // SCEN-517
  test('メールアドレスが空文字列の部員に対しては送信をスキップし、エラーログを出力し、他の正常なメールアドレスを持つ部員への催促メール送信は継続実行される', () => {
    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const members_with_empty_email = [
      {
        user_id: 'ENG001',
        user_name: 'エンジニア太郎',
        email_address: '',
        department_id: 'DEV001',
        report_status: 'unreported',
      },
      {
        user_id: 'ENG002',
        user_name: 'エンジニア花子',
        email_address: 'hanako@example.com',
        department_id: 'DEV001',
        report_status: 'unreported',
      },
    ];

    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');

    const result = sendUrgentNotificationEmailsForMissingReports({
      members: members_with_empty_email,
      meeting_start_time: morning_meeting_start_time,
      logger: mockLogger,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/メールアドレスが空.*ENG001/)
    );

    expect(result.skipped_members).toContainEqual(
      expect.objectContaining({
        user_id: 'ENG001',
        skip_reason: 'empty_email',
      })
    );

    expect(result.sent_count).toBe(1);

    expect(result.skipped_count).toBe(1);

    expect(result.unreported_members_after_sending).toContainEqual(
      expect.objectContaining({
        user_id: 'ENG001',
        report_status: 'unreported',
      })
    );

    expect(result.unreported_members_after_sending).toContainEqual(
      expect.objectContaining({
        user_id: 'ENG002',
        report_status: 'unreported',
      })
    );
  });
});