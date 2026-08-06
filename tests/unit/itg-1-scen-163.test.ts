import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信フォーム', () => {
  // SCEN-163
  test('第2項目が空文字列のとき送信を中断してエラーメッセージを表示する', () => {
    const submission_input = {
      yesterday_achievement: '昨日の業務を完了しました',
      today_plan: '',
      current_issues: '特になし',
    };

    expect(() => validateMorningReportSubmission(submission_input)).toThrow(/今日やること/);
  });
});