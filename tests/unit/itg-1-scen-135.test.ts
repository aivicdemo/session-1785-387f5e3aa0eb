import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailsForReport } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-135
  test("確認メール自動配信機能 - 送信者本人のメールアドレスが空文字列の場合、メール送信対象から除外される", async () => {
    const report_id = "RPT-2024-0001";
    const report_content = {
      yesterday_achievement: "前日の実績を完了",
      today_plan: "本日の予定を実施",
      current_issue: "抱えている課題を解決",
    };
    const sender_user_id = "USR-001";
    const sender_email = "engineer@example.com";
    const department_head_email = "manager@example.com";
    const additional_recipient_email = "team@example.com";

    const recipients = [
      {
        user_id: sender_user_id,
        email: sender_email,
        role: "engineer",
      },
      {
        user_id: "USR-002",
        email: "",
        role: "staff",
      },
      {
        user_id: "USR-003",
        email: department_head_email,
        role: "department_head",
      },
      {
        user_id: "USR-004",
        email: additional_recipient_email,
        role: "team_member",
      },
    ];

    const captured_email_destinations = [];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        sent_to: captured_email_destinations,
      }),
      { status: 200 }
    );

    const result = await sendConfirmationEmailsForReport({
      report_id: report_id,
      report_content: report_content,
      sender_user_id: sender_user_id,
      recipients: recipients,
    });

    expect(result.status).toBe("success");
    expect(result.sent_count).toBe(3);
    expect(result.excluded_empty_emails).toBe(1);

    const sent_destinations = result.sent_to;
    expect(sent_destinations).toHaveLength(3);

    const email_addresses = sent_destinations.map((dest) => dest.email);
    expect(email_addresses).toContain(sender_email);
    expect(email_addresses).toContain(department_head_email);
    expect(email_addresses).toContain(additional_recipient_email);
    expect(email_addresses).not.toContain("");

    expect(fetchMock.mock.calls).toHaveLength(1);
    const fetch_request_body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetch_request_body.recipients).toHaveLength(3);
    expect(fetch_request_body.recipients.every((r) => r.email !== "")).toBe(
      true
    );
  });
});