import { validateReportTimestampAndCheckDelay } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-258
  test('朝会報告送信時刻遅延判定機能 - 報告送信タイムスタンプが undefined のとき処理が失敗する', () => {
    const report_obj = {
      report_id: 'RPT001',
      user_id: 'USR001',
      department_id: 'DEPT001',
      yesterday_achievement: '昨日の実績を入力',
      today_plan: '本日の予定を入力',
      issue: '抱えている課題を入力',
      sent_at: undefined,
      meeting_start_time: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() => validateReportTimestampAndCheckDelay(report_obj)).toThrow(
      /timestamp|タイムスタンプ/i
    );
  });
});