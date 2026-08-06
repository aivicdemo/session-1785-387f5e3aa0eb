import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告入力フォームの提供と送信機能', () => {
  // SCEN-102
  test('3項目すべてが空のとき送信を中止してエラーメッセージを表示する', () => {
    const submission_data = {
      yesterday_achievement: '',
      today_plan: '',
      current_issues: '',
    };

    expect(() => validateMorningReportSubmission(submission_data)).toThrow(/3つの項目すべてに入力/);
  });
});