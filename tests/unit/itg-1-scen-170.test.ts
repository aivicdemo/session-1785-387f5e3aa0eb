import { validateReportSubmission } from '../../src/logic/it-1';

describe('朝会報告入力フォームと送信機能', () => {
  // SCEN-170
  test('第3項目が許容最大文字数を超過するとき送信を中断してエラーメッセージを表示する', () => {
    const yesterday_accomplishment = '昨日は機能Aの実装を完了しました';
    const today_plan = '本日は機能Bのテストを実施します';
    const max_chars_for_challenge = 500;
    const challenge_exceeding_by_one = 'a'.repeat(max_chars_for_challenge + 1);

    const result = validateReportSubmission({
      yesterdayAccomplishment: yesterday_accomplishment,
      todayPlan: today_plan,
      challenge: challenge_exceeding_by_one,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      field: 'challenge',
      message: expect.stringMatching(/抱えている課題は【500】文字以内/),
    });
    expect(result.submitButtonDisabled).toBe(true);
  });
});