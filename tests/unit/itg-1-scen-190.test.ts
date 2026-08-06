import { validateReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信フォーム - バリデーションと送信機能', () => {
  // SCEN-190: [edge] 朝会報告送信バリデーション - 項目3が最小許容文字数ちょうどで送信が続行される
  test('項目3が最小許容文字数ちょうどの場合、送信ボタンが有効になり、バリデーションエラーメッセージは表示されない', () => {
    const yesterday_work = '昨日の作業';
    const today_plan = '今日の予定';
    const current_issue = '課題';

    const result = validateReportSubmission({
      yesterday_work,
      today_plan,
      current_issue,
    });

    expect(result.is_valid).toBe(true);
    expect(result.can_submit).toBe(true);
    expect(result.error_messages).toEqual([]);
    expect(result.validation_errors).toEqual({
      yesterday_work: null,
      today_plan: null,
      current_issue: null,
    });
  });
});