import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

import { createTestDatabase, cleanupTestDatabase } from "../../src/test/db-setup";
import { getEnvVariable } from "../../src/config/env";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-285
  test("確認メール配信・日報一覧集約機能 - 部長に確認メールが配信される", async () => {
    fetchMock.resetMocks();

    const test_db = await createTestDatabase();

    const department_head_email = "head@example.com";
    jest.spyOn(global, "process", "get").mockReturnValue({
      ...process,
      env: {
        ...process.env,
        DEPARTMENT_HEAD_EMAIL: department_head_email,
      },
    } as any);

    const member_ids = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const submitted_members = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const unsubmitted_members = ["I", "J"];

    await test_db("users").del();
    await test_db("daily_reports").del();
    await test_db("report_send_history").del();
    await test_db("audit_events").del();

    for (const member_id of member_ids) {
      await test_db("users").insert({
        user_id: member_id,
        user_name: `Member ${member_id}`,
        department: "dev",
        role: "engineer",
      });
    }

    const fixed_submission_time = new Date("2024-01-15T08:30:00Z");
    const fixed_current_time = new Date("2024-01-15T09:00:00Z");

    for (const member_id of submitted_members) {
      await test_db("daily_reports").insert({
        report_id: `report_${member_id}`,
        user_id: member_id,
        report_date: "2024-01-15",
        yesterday_achievement: `Yesterday work by ${member_id}`,
        today_plan: `Today plan by ${member_id}`,
        issues: `Issue by ${member_id}`,
        created_at: fixed_submission_time,
      });

      await test_db("report_send_history").insert({
        history_id: `history_${member_id}`,
        user_id: member_id,
        report_date: "2024-01-15",
        sent_at: fixed_submission_time,
        status: "sent",
      });
    }

    const mock_ai_client: Tx2Imp1AiClient = {
      judgeUnsubmittedMembers: jest.fn().mockResolvedValue({
        unsubmitted_members: unsubmitted_members,
        delayed_members: [],
      }),
    };

    const send_email_endpoint = "https://api.mail-service.local/send";
    fetchMock.mockResponseOnce(
      JSON.stringify({
        mail_id: "mail_20240115_001",
        status: "queued",
      }),
      { status: 200 }
    );

    await runTx2Imp1Agent(
      test_db,
      mock_ai_client,
      fixed_current_time,
      department_head_email
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const send_email_call = fetchMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(send_email_call[0]).toBe(send_email_endpoint);
    expect(send_email_call[1].method).toBe("POST");

    const email_payload = JSON.parse(send_email_call[1].body as string);
    expect(email_payload.to).toBe(department_head_email);
    expect(email_payload.subject).toMatch(/日報確認/);
    expect(email_payload.body).toContain("部員I");
    expect(email_payload.body).toContain("部員J");

    const audit_events = await test_db("audit_events")
      .where({
        event_type: "CONFIRMATION_EMAIL_SENT",
        target_role: "department_head",
        unsubmitted_count: 2,
      });

    expect(audit_events).toHaveLength(1);
    expect((audit_events[0] as { timestamp: unknown }).timestamp).toBeDefined();

    await cleanupTestDatabase(test_db);
  });
});