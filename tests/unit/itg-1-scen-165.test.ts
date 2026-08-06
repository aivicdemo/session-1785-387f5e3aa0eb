import { validateAndSubmitReport } from '../../src/logic/it-1';

describe('朝会報告送信フォーム', () => {
  // SCEN-165
  test('第1項目が未定義のとき送信を中断してエラーメッセージを表示する', () => {
    const report = {
      yesterday_achievement: undefined,
      today_plan: 'タスクA実施',
      current_issues: '課題なし',
    };

    expect(() => validateAndSubmitReport(report)).toThrow(/昨日やったこと/);
  });
});