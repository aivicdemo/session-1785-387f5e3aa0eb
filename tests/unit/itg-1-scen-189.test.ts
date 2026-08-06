import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信フォーム', () => {
  // SCEN-189
  test('項目2が最小許容文字数直下でバリデーションエラーが発生する', () => {
    const yesterday_accomplishment = '昨日はタスクAとタスクBを完了しました';
    const today_plan = 'あ'; // 最小許容文字数2より1文字少ない
    const current_issues = 'データベース接続のタイムアウト問題が発生中です';

    const result = validateMorningReportSubmission({
      yesterday_accomplishment,
      today_plan,
      current_issues,
    });

    expect(result.is_valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'today_plan',
          message: expect.stringMatching(/今日やること.*2文字以上/),
        }),
      ])
    );
    expect(result.should_send_confirmation_email).toBe(false);
  });
});