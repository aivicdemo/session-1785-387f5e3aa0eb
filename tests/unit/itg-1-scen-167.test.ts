import { validateAndSendReport } from '../../src/logic/it-1';

describe('朝会報告送信フォーム - バリデーション', () => {
  // SCEN-167
  test('第3項目が未定義のとき送信を中断してエラーメッセージを表示する', () => {
    const report_input = {
      yesterday_achievement: 'タスクA完了',
      today_plan: 'タスクB着手',
      current_issue: undefined,
    };

    expect(() => validateAndSendReport(report_input)).toThrow(/抱えている課題/);
  });
});