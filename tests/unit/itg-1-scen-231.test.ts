import { describe, test, expect } from "@jest/globals";
import { formatUnifiedReportForDisplay } from "../../src/logic/it-1-br-1-1-1";

describe("日報統一フォーマット整形・表示機能", () => {
  // SCEN-231
  test("送信日時情報が欠けている場合、エラーが発生する", () => {
    const reportWithoutTimestamp = {
      yesterday_achievement: "昨日は機能Aの実装を完了した",
      today_plan: "本日は機能Bのテストを実施する",
      current_issue: "データベース接続の遅延が発生している",
    };

    expect(() => formatUnifiedReportForDisplay(reportWithoutTimestamp)).toThrow(
      /送信日時/
    );
  });
});