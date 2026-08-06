import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendMorningReportConfirmationEmail } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時の確認メール自動配信 - 部長メールアドレス検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-268
  test('部長メールアドレスが不正な形式のとき、メール送信処理が失敗してバリデーションエラーを返す', () => {
    const invalid_email_patterns = [
      'admin@',
      '@example.com',
      'admin@.com'
    ];

    invalid_email_patterns.forEach((invalid_manager_email) => {
      const report_data = {
        report_id: 'RPT-20240115-001',
        user_id: 'ENG-001',
        user_name: 'Engineer User',
        user_email: 'engineer@company.com',
        submitted_at: '2024-01-15T09:30:00Z',
        yesterday_achievement: 'Completed feature A implementation',
        today_plan: 'Testing feature A',
        current_issue: 'Waiting for design approval',
        manager_email: invalid_manager_email,
        morning_meeting_start_time: '2024-01-15T09:00:00Z'
      };

      expect(() => {
        sendMorningReportConfirmationEmail(report_data);
      }).toThrow(/メールアドレス|EMAIL_FORMAT|形式/);
    });
  });
});