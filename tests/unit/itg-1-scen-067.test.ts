import { describe, test, expect, beforeEach } from "@jest/globals";
import { sendConfirmationEmailOnReportSubmit } from "../../src/logic/it-2";

describe("確認メール自動配信機能 - 送信者メールアドレス検証", () => {
  // SCEN-067
  test("should throw error when sender email address is null", () => {
    const report_submission = {
      user_id: "ENG001",
      department_id: "DEV",
      sender_email: null,
      yesterday_achievement: "昨日の実績です",
      today_plan: "本日の予定です",
      current_issues: "抱えている課題です",
      submitted_at: new Date("2024-01-15T09:00:00Z"),
      morning_meeting_start_time: new Date("2024-01-15T10:00:00Z"),
    };

    expect(() => sendConfirmationEmailOnReportSubmit(report_submission)).toThrow(
      /送信者メールアドレス/
    );
  });
});