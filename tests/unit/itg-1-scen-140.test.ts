import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { submitDailyReport } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-140
  test("月末日の日報送信時、メール送信ログに正しく記録される", async () => {
    const submission_timestamp = new Date("2024-01-31T08:30:00Z");
    const staff_id = "ENG001";
    const staff_name = "山田太郎";
    const manager_email = "yamamoto.hanako@company.com";
    const yesterday_achievement = "タスクA完了";
    const today_plan = "タスクB開始";
    const current_issue = "リソース不足";

    const submit_payload = {
      staff_id,
      staff_name,
      manager_email,
      submission_timestamp,
      yesterday_achievement,
      today_plan,
      current_issue,
    };

    const expected_email_log = {
      log_id: expect.any(String),
      sent_at: "2024-01-31T08:30:00Z",
      recipient_email: manager_email,
      email_subject: expect.stringContaining("朝会報告"),
      email_body: expect.stringMatching(
        new RegExp(
          `${staff_name}.*${yesterday_achievement}.*${today_plan}.*${current_issue}`,
          "s"
        )
      ),
      send_status: "送信成功",
      created_at: expect.any(String),
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        email_log: expected_email_log,
      }),
      { status: 200 }
    );

    const result = await submitDailyReport(submit_payload);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.email_log).toBeDefined();
    expect(result.email_log.sent_at).toBe("2024-01-31T08:30:00Z");
    expect(result.email_log.recipient_email).toBe(manager_email);
    expect(result.email_log.email_subject).toContain("朝会報告");
    expect(result.email_log.email_body).toContain(staff_name);
    expect(result.email_log.email_body).toContain(yesterday_achievement);
    expect(result.email_log.email_body).toContain(today_plan);
    expect(result.email_log.email_body).toContain(current_issue);
    expect(result.email_log.send_status).toBe("送信成功");
  });
});