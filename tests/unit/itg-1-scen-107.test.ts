import { validateAndSendReport } from "../../src/logic/it-1";

describe("朝会報告送信検証機能", () => {
  // SCEN-107
  test("昨日の実績が空文字列で送信を中止", () => {
    const report_input = {
      yesterday_achievement: "",
      today_plan: "タスクA実施",
      current_issue: "課題B対応中",
    };

    expect(() => validateAndSendReport(report_input)).toThrow(/昨日の実績/);
  });
});