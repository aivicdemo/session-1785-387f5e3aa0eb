import { describe, it, expect, beforeEach } from "@jest/globals";
import { sendConfirmationEmailsOnReportSubmission } from "../../src/logic/it-1-br-1-1-1";

describe("Report submission confirmation email delivery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-419
  it("should throw error when department head ID is null", () => {
    const submission_data = {
      reporter_id: "ENG001",
      reporter_name: "田中太郎",
      department_id: "DEV",
      yesterday_achievement: "バグ修正完了",
      today_plan: "新機能実装開始",
      issues: "ネットワーク遅延",
      submitted_at: new Date("2024-01-15T08:30:00Z"),
    };

    const department_head_id = null;

    expect(() =>
      sendConfirmationEmailsOnReportSubmission(
        submission_data,
        department_head_id
      )
    ).toThrow(/部長ID/);
  });
});