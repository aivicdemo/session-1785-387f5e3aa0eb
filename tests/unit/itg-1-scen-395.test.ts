import { validateReportSubmissionDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-395
  test('朝会開始時刻の直前（1秒前）に報告送信された場合、期限内と判定される', () => {
    const meetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTime = new Date('2024-01-15T08:59:59Z');
    const reportContent = {
      yesterday: 'A機能の実装完了',
      today: 'B機能の仕様確認',
      issues: 'C機能のテスト環境構築',
    };

    const result = validateReportSubmissionDeadline({
      submissionTime,
      meetingStartTime,
      reportContent,
    });

    expect(result.status).toBe('期限内');
    expect(result.isOnTime).toBe(true);
  });
});