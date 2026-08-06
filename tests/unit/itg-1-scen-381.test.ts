import { validateReportDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告期限判定機能 - 朝会開始時刻が undefined のとき、期限判定が実行されない', () => {
  // SCEN-381
  test('朝会開始時刻が undefined のとき例外をスローする', () => {
    const report_content = {
      yesterday_achievement: 'データベース設計の完了',
      today_plan: 'APIサーバーの実装開始',
      current_issues: 'ライブラリのバージョン互換性問題',
    };
    const submitted_at = new Date('2024-01-15T10:30:00Z');
    const morning_meeting_start_time = undefined;

    expect(() =>
      validateReportDeadline(
        report_content,
        submitted_at,
        morning_meeting_start_time
      )
    ).toThrow(/朝会開始時刻/);
  });
});