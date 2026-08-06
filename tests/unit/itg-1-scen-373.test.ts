import { isReportOnTime } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  test('SCEN-373: [normal] 報告期限判定機能 - 朝会開始時刻より前に送信された報告は期限内と判定される', () => {
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const report_submission_time = new Date('2024-01-15T08:55:00Z');

    const result = isReportOnTime({
      meeting_start_time,
      report_submission_time,
    });

    expect(result).toBe(true);
  });
});