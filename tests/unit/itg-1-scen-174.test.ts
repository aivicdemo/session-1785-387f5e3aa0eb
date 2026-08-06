import { validateReportInput } from '../../src/logic/it-1';

describe('朝会報告送信バリデーション', () => {
  // SCEN-174
  test('第1項目の形式が要求形式に不適合のとき送信を中断してエラーメッセージを表示する', () => {
    const invalidFirstItem = '<script>alert("test")</script>';
    const validSecondItem = '本日の予定を記載します';
    const validThirdItem = '現在の課題を記載します';

    const input = {
      yesterday_achievement: invalidFirstItem,
      today_plan: validSecondItem,
      current_issue: validThirdItem,
    };

    expect(() => validateReportInput(input)).toThrow(/形式/);
  });
});