import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnreportedReminderNotification } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("未報告催促通知機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-498
  test("朝会開始15分前に未報告者が複数名の場合、部長に対して全未報告部員名と催促メッセージが通知される", async () => {
    const morning_assembly_start_time = new Date("2024-01-15T09:00:00Z");
    const current_time = new Date("2024-01-15T08:45:00Z");
    const manager_id = "mgr_001";
    const manager_email = "manager@example.com";

    const reported_members = [
      {
        member_id: "emp_001",
        member_name: "部員A",
        email: "empA@example.com",
        report_sent_at: new Date("2024-01-15T08:30:00Z"),
      },
      {
        member_id: "emp_002",
        member_name: "部員B",
        email: "empB@example.com",
        report_sent_at: new Date("2024-01-15T08:35:00Z"),
      },
      {
        member_id: "emp_003",
        member_name: "部員C",
        email: "empC@example.com",
        report_sent_at: new Date("2024-01-15T08:40:00Z"),
      },
    ];

    const unreported_members = [
      {
        member_id: "emp_004",
        member_name: "部員D",
        email: "empD@example.com",
      },
      {
        member_id: "emp_005",
        member_name: "部員E",
        email: "empE@example.com",
      },
      {
        member_id: "emp_006",
        member_name: "部員F",
        email: "empF@example.com",
      },
      {
        member_id: "emp_007",
        member_name: "部員G",
        email: "empG@example.com",
      },
      {
        member_id: "emp_008",
        member_name: "部員H",
        email: "empH@example.com",
      },
      {
        member_id: "emp_009",
        member_name: "部員I",
        email: "empI@example.com",
      },
      {
        member_id: "emp_010",
        member_name: "部員J",
        email: "empJ@example.com",
      },
    ];

    const all_members = [...reported_members, ...unreported_members];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message_id: "msg_20240115_001",
      }),
      { status: 200 }
    );

    const result = await sendUnreportedReminderNotification({
      morning_assembly_start_time,
      current_time,
      manager_id,
      manager_email,
      reported_members,
      unreported_members,
      all_members,
    });

    expect(fetchMock.mock.calls).toHaveLength(1);

    const call_args = fetchMock.mock.calls[0][1];
    const request_body = JSON.parse(call_args.body);

    expect(request_body.recipient_email).toBe("manager@example.com");
    expect(request_body.subject).toContain("朝会開始15分前の催促通知");
    expect(request_body.body).toContain(
      "報告未提出者: 部員D、部員E、部員F、部員G、部員H、部員I、部員J（7名）"
    );
    expect(request_body.body).toContain("朝会開始までに報告をお願いします");

    expect(result.success).toBe(true);
    expect(result.unreported_count).toBe(7);
    expect(result.notified_at).toEqual(current_time);
  });
});