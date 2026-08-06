import { judgeReportDelay } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  test('SCEN-276: 年度をまたぐ朝会開始時刻と送信時刻の比較で遅延判定が正確に行われる', () => {
    // システム時刻: 2024年3月31日 08:55:00（年度末）
    const system_time = new Date('2024-03-31T08:55:00Z');

    // 朝会開始時刻: 2024年4月1日 09:00:00（翌年度、年をまたぐ）
    const morning_meeting_start_time = new Date('2024-04-01T09:00:00Z');

    // ユーザーが2024年3月31日 09:05:00に朝会報告を送信
    const user_report_send_time = new Date('2024-03-31T09:05:00Z');

    // 送信時刻判定機能が、送信時刻と朝会開始時刻を比較
    const result = judgeReportDelay({
      report_send_time: user_report_send_time,
      morning_meeting_start_time: morning_meeting_start_time,
    });

    // 期待結果: 送信時刻（2024年3月31日 09:05:00）が朝会開始時刻（2024年4月1日 09:00:00）より前であるため、
    // 遅延フラグが false（遅延ではない）となり、ステータスが『定時送信』と判定される
    expect(result.is_delayed).toBe(false);
    expect(result.status).toBe('定時送信');
  });
});