import { describe, test, expect } from "@jest/globals";
import { validateAndAggregateReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-485
  test("抱えている課題が空文字列の場合にバリデーションエラーをスローする", () => {
    const report_input = {
      yesterday_achievement: "完了した業務A",
      today_plan: "予定された業務B",
      current_challenge: "",
    };

    expect(() => validateAndAggregateReport(report_input)).toThrow(/課題/);
  });
});