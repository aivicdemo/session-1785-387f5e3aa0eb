import { validateDailyReport } from '../../src/logic/it-1';

describe('朝会報告送信フォーム', () => {
  // SCEN-105
  test('本日の予定のみ空欄でエラーメッセージを表示', () => {
    const report_input = {
      yesterday_achievement: '会議参加、ドキュメント作成',
      today_plan: '',
      current_issues: 'プロジェクトのスケジュール調整',
    };

    const result = validateDailyReport(report_input);

    expect(result.is_valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      field: 'today_plan',
      message_key: 'REQUIRED_FIELD',
    });
    expect(result.can_submit).toBe(false);
  });
});