import { validateAndSubmitDailyReport } from '../../src/logic/it-1';

describe('朝会報告送信検証機能', () => {
  // SCEN-106
  test('[edge] 抱えている課題のみ空欄でエラーメッセージを表示', () => {
    const input = {
      yesterdayAccomplishment: '昨日は機能Aの実装を完了しました',
      todayPlan: '本日は機能Bの実装を開始する予定です',
      currentChallenges: '',
    };

    const result = validateAndSubmitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'currentChallenges',
          message: expect.stringMatching(/抱えている課題/),
        }),
      ])
    );
    expect(result.isSubmitted).toBe(false);
    expect(result.confirmationEmailSent).toBe(false);
  });
});