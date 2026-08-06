import { sendConfirmationEmail } from '../../src/logic/it-2';

describe('送信時の自動確認メール通知', () => {
  // SCEN-074
  test('朝会報告内容が null のときエラーとなる', () => {
    const morning_report_with_null_content = {
      report_id: 'RPT-20240115-001',
      user_id: 'USR-E001',
      report_content: null,
      submitted_at: new Date('2024-01-15T08:30:00Z'),
      department_id: 'DEPT-DEV',
    };

    expect(() => sendConfirmationEmail(morning_report_with_null_content)).toThrow(
      /報告内容/
    );
  });
});