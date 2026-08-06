import { describe, test, expect, beforeEach } from "@jest/globals";
import { judgePromptionNeeded } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-378
  test("[normal] 催促要否自動判定機能 - 期限超過で報告未送信の部員は催促要と判定される", () => {
    const report_deadline = new Date("2024-01-15T09:00:00Z");
    const current_time = new Date("2024-01-15T10:00:00Z");
    const employee_id = "EMP001";
    const yesterday_result = "";
    const today_plan = "";
    const current_issue = "";
    const report_sent_at: Date | null = null;

    const result = judgePromptionNeeded({
      employee_id,
      report_deadline,
      current_time,
      yesterday_result,
      today_plan,
      current_issue,
      report_sent_at,
    });

    expect(result.needs_promotion).toBe(true);
    expect(result.reason).toMatch(/期限超過/);
    expect(result.reason).toMatch(/未送信/);
  });
});