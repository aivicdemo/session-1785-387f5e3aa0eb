import { isReportOverdue } from '../../src/logic/it-1-br-1-1-1';

describe('報告期限判定機能', () => {
  // SCEN-394
  test('朝会開始時刻をちょうど経過した時点で期限超過と判定される', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTime = new Date('2024-01-15T09:00:00Z');

    const result = isReportOverdue({
      morningMeetingStartTime,
      currentTime,
    });

    expect(result).toBe(true);
  });
});