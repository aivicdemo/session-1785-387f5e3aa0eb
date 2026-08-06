import { describe, test, expect } from "@jest/globals";
import { validateAllReportsSubmitted } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-354
  test("全員報告完了判定機能 - 報告者データが空配列のときエラーが発生する", () => {
    const empty_reporters = [];

    expect(() => validateAllReportsSubmitted(empty_reporters)).toThrow(
      /報告者データが空/
    );

    try {
      validateAllReportsSubmitted(empty_reporters);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.name).toBe("ValidationError");
      }
    }
  });
});