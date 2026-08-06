import { formatDailyReportUnified } from '../../src/logic/it-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-219
  test('部員1名の日報が統一フォーマット（昨日やったこと・今日やること・抱えている課題）で整形される', () => {
    const daily_report_data = {
      yesterday_achievement: '顧客Aの要件ヒアリング完了',
      today_plan: '設計書作成開始',
      current_issue: 'ネットワーク遅延の原因調査中',
    };

    const formatted_result = formatDailyReportUnified(daily_report_data);

    const expected_output = '【昨日やったこと】顧客Aの要件ヒアリング完了\n【今日やること】設計書作成開始\n【抱えている課題】ネットワーク遅延の原因調査中';

    expect(formatted_result).toBe(expected_output);
  });
});