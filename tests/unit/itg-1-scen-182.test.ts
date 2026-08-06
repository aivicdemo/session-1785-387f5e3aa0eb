import { validateDailyReportSubmission } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-182: [edge] 朝会報告送信バリデーション - 項目2の文字数が最大許容値直上でエラーが発生する
  test('項目2が最大許容文字数を超過した場合、バリデーションエラーが発生し送信が中止される', () => {
    const max_chars_item2 = 500;
    const valid_item1 = '昨日は機能A の実装を完了しました。単体テストも合格しました。';
    const invalid_item2 = 'a'.repeat(max_chars_item2 + 1);
    const valid_item3 = 'DBコネクション周りで若干のレイテンシがあります。';

    const submission_input = {
      yesterday_achievement: valid_item1,
      today_plan: invalid_item2,
      current_issue: valid_item3,
    };

    expect(() => validateDailyReportSubmission(submission_input)).toThrow(/項目2/);
  });
});