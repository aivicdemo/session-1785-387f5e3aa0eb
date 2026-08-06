import { validateReportBeforeSend } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-166
  test('朝会報告送信バリデーション - 第2項目が未定義(undefined)のとき送信を中断してエラーメッセージを表示する', () => {
    const yesterday_task = 'タスクA完了';
    const today_plan = undefined;
    const current_issue = '課題なし';

    const report_input = {
      yesterday_task,
      today_plan,
      current_issue,
    };

    expect(() => validateReportBeforeSend(report_input)).toThrow(/今日やること/);
  });
});