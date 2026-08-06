import { validateReportContent } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-484
  test('抱えている課題が欠落している場合にエラーになる', () => {
    const reportData = {
      user_id: 'ENG001',
      yesterday_achievement: '昨日の実績を入力',
      today_plan: '本日の予定を入力',
      issues_held: '',
      report_date: '2024-01-15',
    };

    expect(() => validateReportContent(reportData)).toThrow(/抱えている課題/);
  });
});