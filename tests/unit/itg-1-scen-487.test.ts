import { validateReportContent } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-487
  test('報告内容検証・集約機能 - 部長情報が欠落している場合にエラーになる', () => {
    const report_data_with_empty_manager = {
      user_id: 'ENG001',
      department_id: 'DEV001',
      manager_user_id: '',
      yesterday_accomplishment: '昨日の実績を記録しました',
      today_plan: '本日の予定を立案しました',
      current_issues: '現在の課題を整理しました',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
    };

    expect(() => validateReportContent(report_data_with_empty_manager)).toThrow(/部長情報/);
  });
});