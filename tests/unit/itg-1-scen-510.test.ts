import { sendUnreportedReminderEmails } from "../../src/logic/it-1-br-1-1-1";

describe("未報告催促メール通知機能", () => {
  // SCEN-510
  test("朝会開始時刻を過ぎた場合は催促メール送信をスキップする", () => {
    const meeting_start_time = new Date("2024-01-15T09:00:00Z");
    const current_time = new Date("2024-01-15T09:15:00Z");
    const unreported_user_ids = ["user_001", "user_002"];

    const result = sendUnreportedReminderEmails({
      meeting_start_time,
      current_time,
      unreported_user_ids,
    });

    expect(result.emails_sent).toBe(0);
    expect(result.skipped).toBe(true);
    expect(result.skip_reason).toMatch(/朝会開始時刻/);
  });
});