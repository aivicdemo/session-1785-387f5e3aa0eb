import { validateAndSendReport } from "../../src/logic/it-1";

describe("朝会報告送信検証機能", () => {
  test("SCEN-096: 本日の予定がnullのとき送信を中止してエラーメッセージを表示する", () => {
    const report_input = {
      user_id: "ENG001",
      yesterday_achievement: "昨日は機能Aを実装した",
      today_plan: null,
      current_issues: "スキーマ設計に課題がある",
      submitted_at: new Date("2024-01-15T08:30:00Z"),
    };

    expect(() => validateAndSendReport(report_input)).toThrow(/本日の予定/);
  });
});