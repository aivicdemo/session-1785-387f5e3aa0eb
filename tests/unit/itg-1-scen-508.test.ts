import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  sendUnsumittedReportReminderNotification,
  type UnsumittedReportReminderInput,
  type MailSendResult,
} from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("未報告催促メール通知機能 - 報告送信履歴データが空配列の場合", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-508
  test("報告送信履歴が空配列の場合、全員（10名）を未報告として催促メール送信", async () => {
    // Arrange
    const mockEmployees = [
      {
        user_id: "USR001",
        user_name: "田中太郎",
        email_address: "tanaka.taro@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR002",
        user_name: "鈴木花子",
        email_address: "suzuki.hanako@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR003",
        user_name: "佐藤次郎",
        email_address: "sato.jiro@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR004",
        user_name: "高橋美咲",
        email_address: "takahashi.misaki@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR005",
        user_name: "伊藤健司",
        email_address: "ito.kenji@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR006",
        user_name: "渡辺由美",
        email_address: "watanabe.yumi@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR007",
        user_name: "木村正樹",
        email_address: "kimura.masaki@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR008",
        user_name: "中村由香",
        email_address: "nakamura.yuka@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR009",
        user_name: "小林健一",
        email_address: "kobayashi.kenichi@company.com",
        department_id: "DEPT01",
      },
      {
        user_id: "USR010",
        user_name: "山本真一",
        email_address: "yamamoto.shinichi@company.com",
        department_id: "DEPT01",
      },
    ];

    const emptySubmissionHistory: [] = [];

    const morningMeetingTime = new Date("2024-01-15T09:00:00Z");

    const input: UnsumittedReportReminderInput = {
      submission_history: emptySubmissionHistory,
      employees: mockEmployees,
      morning_meeting_time: morningMeetingTime,
      department_id: "DEPT01",
    };

    // Mock: ユーザー取得 API
    fetchMock.mockResponseOnce(JSON.stringify({ users: mockEmployees }), {
      status: 200,
    });

    // Mock: メール送信 API - 10 件分
    for (let i = 0; i < 10; i++) {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          mail_send_id: `MAILSEND${String(i + 1).padStart(5, "0")}`,
          recipient_email: mockEmployees[i].email_address,
          status: "sent",
          sent_at: "2024-01-15T08:30:00Z",
        }),
        { status: 200 }
      );
    }

    // Act
    const result = await sendUnsumittedReportReminderNotification(input);

    // Assert
    expect(result.total_unsumitted_count).toBe(10);
    expect(result.reminder_mails_sent).toBe(10);
    expect(result.unsumitted_user_ids).toEqual([
      "USR001",
      "USR002",
      "USR003",
      "USR004",
      "USR005",
      "USR006",
      "USR007",
      "USR008",
      "USR009",
      "USR010",
    ]);

    const mailsSent: MailSendResult[] = result.mail_send_results;
    expect(mailsSent).toHaveLength(10);

    for (let i = 0; i < 10; i++) {
      expect(mailsSent[i].recipient_email).toBe(
        mockEmployees[i].email_address
      );
      expect(mailsSent[i].status).toBe("sent");
      expect(mailsSent[i].mail_body).toMatch(/朝会報告がまだ送信されていません/);
    }

    // Verify that 11 fetch calls were made (1 for user fetch + 10 for mail sends)
    expect(fetchMock.mock.calls).toHaveLength(11);
  });
});