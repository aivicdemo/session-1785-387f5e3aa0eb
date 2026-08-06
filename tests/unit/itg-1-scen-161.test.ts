import { validateDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-161
  test("日報送信検証機能 - 同じ入力データで2回検証を実行したとき、両回とも同じ結果になる", () => {
    const testReport = {
      yesterday: "A機能の実装",
      today: "B機能のレビュー",
      issues: "C問題の調査",
    };

    const firstValidationResult = validateDailyReport(testReport);
    const secondValidationResult = validateDailyReport(testReport);

    expect(firstValidationResult.isValid).toBe(
      secondValidationResult.isValid
    );
    expect(firstValidationResult.errors).toEqual(
      secondValidationResult.errors
    );
    expect(firstValidationResult.errorCount).toBe(
      secondValidationResult.errorCount
    );
    expect(firstValidationResult.details).toEqual(
      secondValidationResult.details
    );
  });
});