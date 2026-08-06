import { describe, test, expect } from "@jest/globals";
import { formatAndValidateReport } from "../../src/logic/it-1-br-1-1-1";

describe("日報統一フォーマット整形・表示機能", () => {
  // SCEN-235
  test("昨日やったことが空文字列の場合、エラーが発生する", () => {
    const report_data = {
      yesterday_achievement: "",
      today_plan: "本日は機能Aの実装を進める",
      current_issues: "データベース接続時間が長い"
    };

    expect(() => formatAndValidateReport(report_data)).toThrow(/昨日やったことは必須項目です/);
    
    try {
      formatAndValidateReport(report_data);
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      expect(err.code).toBe("REQUIRED_FIELD_MISSING");
    }
  });
});