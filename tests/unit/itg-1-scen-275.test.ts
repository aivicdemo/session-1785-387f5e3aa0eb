import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateReportSubmissionTime } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時刻判定機能', () => {
  // SCEN-275
  test('月をまたぐタイムゾーン変換時に送信時刻判定が正確に行われる', () => {
    const jstTimezone = 'Asia/Tokyo';
    const currentTimeJst = new Date('2024-01-31T23:50:00+09:00');
    const userId = 'engineer_001';

    const result = validateReportSubmissionTime({
      userId,
      currentTimeJst,
      timezoneId: jstTimezone,
    });

    expect(result.isSubmissionTarget).toBe(true);
    expect(result.targetDate).toBe('2024-01-31');
    expect(result.utcTime).toBe('2024-01-31T14:50:00Z');
    expect(result.jstTime).toBe('2024-01-31T23:50:00+09:00');
    expect(result.monthBoundaryHandled).toBe(true);
  });
});