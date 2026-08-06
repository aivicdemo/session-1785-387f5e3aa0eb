import { describe, test, expect } from "@jest/globals";
import { checkAllReportsCompleted } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能 - 全員報告完了判定", () => {
  // SCEN-364
  test("部門情報が null のとき、エラーが発生する", () => {
    const team_members = [
      {
        user_id: "eng_001",
        user_name: "Engineer A",
        department: { department_id: "dev_001", department_name: "Development" },
        report_submitted: true,
        report_timestamp: new Date("2024-01-15T08:00:00Z"),
      },
      {
        user_id: "eng_002",
        user_name: "Engineer B",
        department: null,
        report_submitted: true,
        report_timestamp: new Date("2024-01-15T08:15:00Z"),
      },
      {
        user_id: "eng_003",
        user_name: "Engineer C",
        department: { department_id: "dev_001", department_name: "Development" },
        report_submitted: true,
        report_timestamp: new Date("2024-01-15T08:30:00Z"),
      },
    ];

    expect(() => checkAllReportsCompleted(team_members)).toThrow(/部門情報/);
  });
});