import { validateDailyReportSubmission } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-110: [edge] 朝会報告送信検証機能 - 3項目すべて空欄でエラーメッセージを表示
  test('3項目すべてが空欄の場合、3つのエラーメッセージが同時に表示され、確認メール送信APIは呼び出されない', () => {
    const submitData = {
      yesterdayAccomplishment: '',
      todayPlan: '',
      currentChallenges: '',
    };

    const result = validateDailyReportSubmission(submitData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'yesterdayAccomplishment',
          message: expect.stringMatching(/昨日やったこと.*必須/),
        }),
        expect.objectContaining({
          field: 'todayPlan',
          message: expect.stringMatching(/今日やること.*必須/),
        }),
        expect.objectContaining({
          field: 'currentChallenges',
          message: expect.stringMatching(/抱えている課題.*必須/),
        }),
      ])
    );
    expect(result.shouldSendConfirmationEmail).toBe(false);
  });
});