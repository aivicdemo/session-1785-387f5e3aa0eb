import { isReportWithinDeadline } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  test('SCEN-374: 報告期限判定機能 - 朝会開始時刻と同時刻に送信された報告は期限内と判定される', () => {
    // Arrange
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00+09:00');
    const report_submission_time = new Date('2024-01-15T09:00:00+09:00');

    // Act
    const result = isReportWithinDeadline(
      report_submission_time,
      morning_meeting_start_time
    );

    // Assert
    expect(result).toBe(true);
  });
});