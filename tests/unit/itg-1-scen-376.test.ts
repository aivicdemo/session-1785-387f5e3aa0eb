import { determinePromptionNeed } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-376
  test("期限内に報告送信済みの部員は催促不要と判定される", () => {
    const deadline_time = new Date("2024-01-15T09:00:00Z");
    const submission_time = new Date("2024-01-15T08:50:00Z");
    const employee_id = "EMP001";
    const submission_date = "2024-01-15";

    const result = determinePromptionNeed({
      employee_id: employee_id,
      submission_date: submission_date,
      submission_time: submission_time,
      deadline_time: deadline_time,
      is_submitted: true,
    });

    expect(result).toEqual({
      needs_promption: false,
      reason: "期限内に報告済み",
    });
  });
});