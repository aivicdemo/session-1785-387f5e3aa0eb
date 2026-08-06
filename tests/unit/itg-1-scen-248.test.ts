import { determineReportDelay } from '../../src/logic/it-1';

describe('朝会報告送信時の遅延判定機能', () => {
  // SCEN-248
  test('送信時刻が朝会開始時刻より前の場合、遅延フラグがfalseとなる', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const reportSubmissionTime = new Date('2024-01-15T08:45:00Z');

    const result = determineReportDelay({
      morningMeetingStartTime,
      reportSubmissionTime,
    });

    expect(result.isDelayed).toBe(false);
  });
});