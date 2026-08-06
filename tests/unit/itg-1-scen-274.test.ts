import { determineSubmissionDelay } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時刻判定機能', () => {
  // SCEN-274
  test('送信時刻が朝会開始時刻の1ミリ秒超過した場合、遅延ありと判定される', () => {
    const meeting_start_time_ms = new Date('2024-01-15T09:00:00.000Z').getTime();
    const submission_time_ms = new Date('2024-01-15T09:00:00.001Z').getTime();

    const result = determineSubmissionDelay({
      meeting_start_time_ms,
      submission_time_ms,
    });

    expect(result.is_delayed).toBe(true);
    expect(result.delay_milliseconds).toBe(1);
    expect(result.delay_category).toBe('1ミリ秒超過');
  });
});