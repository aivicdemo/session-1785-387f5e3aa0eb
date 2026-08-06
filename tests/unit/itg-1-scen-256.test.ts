import { validateMorningMeetingScheduleTime } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時刻遅延判定機能', () => {
  // SCEN-256
  test('朝会開始予定時刻が空文字列のとき処理が失敗する', () => {
    const scheduledStartTime = '';
    const reportSubmissionTime = '09:30';

    expect(() => {
      validateMorningMeetingScheduleTime(scheduledStartTime, reportSubmissionTime);
    }).toThrow(/朝会開始予定時刻/);
  });
});