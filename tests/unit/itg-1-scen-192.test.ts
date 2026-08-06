import { validateReportSubmission } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-192: [edge] 朝会報告送信バリデーション - 全項目が形式ルールに完全適合して送信が続行される
  test('全項目が形式ルールに完全適合して送信が続行される', () => {
    const yesterdayAccomplishment = '昨日のタスクA完了';
    const todayPlan = '今日のタスクB開始';
    const currentIssue = '課題C対応予定';

    const result = validateReportSubmission({
      yesterdayAccomplishment,
      todayPlan,
      currentIssue,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.shouldContinue).toBe(true);
  });
});