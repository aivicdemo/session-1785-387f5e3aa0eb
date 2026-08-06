import { validateReportDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告期限判定機能 - 朝会開始時刻が null のときの動作', () => {
  // SCEN-380
  test('朝会開始時刻が null のとき、期限判定が実行されず null を返す', () => {
    const reportedAt = new Date('2024-01-15T09:30:00Z');
    const meetingStartTime = null;

    const result = validateReportDeadline({
      reportedAt,
      meetingStartTime,
    });

    expect(result).toBeNull();
  });
});