import { describe, test, expect, beforeEach } from "@jest/globals";
import { shouldPromptEmployee } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-377: [normal] 催促要否自動判定機能 - 期限超過で報告送信済みの部員は催促不要と判定される
  test("期限超過で報告送信済みの部員は催促不要と判定される", () => {
    const today = new Date("2024-01-15T09:00:00Z");
    const deadline = new Date("2024-01-14T18:00:00Z");
    const submissionTimestamp = new Date("2024-01-15T08:30:00Z");

    const result = shouldPromptEmployee({
      employeeId: "EMP001",
      deadline: deadline,
      submissionTimestamp: submissionTimestamp,
      currentTime: today,
      isSubmitted: true,
    });

    expect(result).toBe(false);
  });
});