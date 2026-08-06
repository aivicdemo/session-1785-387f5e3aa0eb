import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/types";
import type {
  User,
  Department,
  MorningReportSubmission,
  ReportSendHistory,
} from "../../src/db/schema";

interface MockDatabase {
  users: User[];
  departments: Department[];
  submissions: MorningReportSubmission[];
  send_history: ReportSendHistory[];
}

interface AuditLogEntry {
  task_name: string;
  status: "completed" | "failed";
  timestamp: string;
  agent_action: string;
}

class FakeTx2Imp1AiClient implements Tx2Imp1AiClient {
  private mock_judgment_result: {
    unsubmitted: Array<{ user_id: string; user_name: string }>;
    delayed: Array<{ user_id: string; user_name: string }>;
    judgment_timestamp: string;
  };

  constructor(judgment_result: {
    unsubmitted: Array<{ user_id: string; user_name: string }>;
    delayed: Array<{ user_id: string; user_name: string }>;
    judgment_timestamp: string;
  }) {
    this.mock_judgment_result = judgment_result;
  }

  async judgeUnsubmittedAndDelayed(query: {
    submission_status: Record<string, boolean>;
    deadline_timestamp: string;
    current_timestamp: string;
  }): Promise<{
    unsubmitted: Array<{ user_id: string; user_name: string }>;
    delayed: Array<{ user_id: string; user_name: string }>;
  }> {
    return {
      unsubmitted: this.mock_judgment_result.unsubmitted,
      delayed: this.mock_judgment_result.delayed,
    };
  }
}

class StubMailService {
  private sent_emails: Array<{
    to: string;
    subject: string;
    body: string;
    sent_at: string;
  }> = [];

  async send_notification_email(params: {
    recipient_email: string;
    subject: string;
    body: string;
  }): Promise<{ success: boolean; sent_at: string }> {
    const sent_at = new Date().toISOString();
    this.sent_emails.push({
      to: params.recipient_email,
      subject: params.subject,
      body: params.body,
      sent_at: sent_at,
    });
    return { success: true, sent_at: sent_at };
  }

  get_sent_emails(): Array<{
    to: string;
    subject: string;
    body: string;
    sent_at: string;
  }> {
    return this.sent_emails;
  }

  reset(): void {
    this.sent_emails = [];
  }
}

class MockAuditLogger {
  private log_entries: AuditLogEntry[] = [];

  record_agent_action(entry: AuditLogEntry): void {
    this.log_entries.push(entry);
  }

  get_log_entries(): AuditLogEntry[] {
    return this.log_entries;
  }

  reset(): void {
    this.log_entries = [];
  }
}

describe("日報収集から報告漏れ特定までの自動判定と通知 AIエージェント", () => {
  let mock_db: MockDatabase;
  let stub_mail_service: StubMailService;
  let mock_audit_logger: MockAuditLogger;
  let fake_ai_client: FakeTx2Imp1AiClient;

  const DEPARTMENT_ID_DEV = "dept_001";
  const MANAGER_USER_ID = "user_manager_001";
  const MANAGER_EMAIL = "manager@example.com";
  const SUBMISSION_DEADLINE = "2024-01-15T09:00:00Z";
  const MONITOR_TIMESTAMP = "2024-01-15T09:05:00Z";

  beforeEach(() => {
    mock_db = {
      users: [],
      departments: [],
      submissions: [],
      send_history: [],
    };

    stub_mail_service = new StubMailService();
    mock_audit_logger = new MockAuditLogger();

    // Setup: Create department
    mock_db.departments.push({
      department_id: DEPARTMENT_ID_DEV,
      department_name: "開発部",
      parent_department_id: null,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    });

    // Setup: Create manager user
    mock_db.users.push({
      user_id: MANAGER_USER_ID,
      user_name: "山田太郎",
      email: MANAGER_EMAIL,
      department_id: DEPARTMENT_ID_DEV,
      role: "manager",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    });

    // Setup: Create 10 engineer users
    for (let i = 1; i <= 10; i++) {
      const user_id = `user_eng_${String(i).padStart(3, "0")}`;
      const user_name =
        i === 1
          ? "太郎"
          : i === 2
            ? "花子"
            : `エンジニア${String(i).padStart(2, "0")}`;
      const email = `engineer${i}@example.com`;

      mock_db.users.push({
        user_id: user_id,
        user_name: user_name,
        email: email,
        department_id: DEPARTMENT_ID_DEV,
        role: "engineer",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      });
    }

    // Setup: Create submissions for 8 engineers (submitted)
    for (let i = 1; i <= 8; i++) {
      const user_id = `user_eng_${String(i).padStart(3, "0")}`;
      mock_db.submissions.push({
        submission_id: `sub_${user_id}_20240115`,
        user_id: user_id,
        submission_date: "2024-01-15",
        yesterday_achievement: "昨日の実績内容",
        today_plan: "本日の予定内容",
        current_issues: "抱えている課題内容",
        submitted_at: "2024-01-15T08:30:00Z",
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-01-15T08:30:00Z",
      });

      mock_db.send_history.push({
        send_history_id: `send_${user_id}_20240115`,
        submission_id: `sub_${user_id}_20240115`,
        user_id: user_id,
        sent_at: "2024-01-15T08:30:00Z",
        send_status: "submitted",
        created_at: "2024-01-15T08:30:00Z",
      });
    }

    // Setup: No submissions for 2 engineers (unsubmitted)
    // user_eng_009 (user_id 9) and user_eng_010 (user_id 10) are unsubmitted

    // Setup: Fake AI client with judgment result
    fake_ai_client = new FakeTx2Imp1AiClient({
      unsubmitted: [
        { user_id: "user_eng_009", user_name: "太郎" },
        { user_id: "user_eng_010", user_name: "花子" },
      ],
      delayed: [],
      judgment_timestamp: MONITOR_TIMESTAMP,
    });
  });

  afterEach(() => {
    stub_mail_service.reset();
    mock_audit_logger.reset();
  });

  // SCEN-545
  test("should create unsubmitted members list and send notification email when 2 out of 10 members have not submitted reports by deadline", async () => {
    // Arrange: Build submission status map from database
    const submission_status_map: Record<string, boolean> = {};
    const user_id_to_name_map: Record<string, string> = {};

    for (const user of mock_db.users) {
      if (user.role === "engineer") {
        user_id_to_name_map[user.user_id] = user.user_name;
        const has_submission = mock_db.submissions.some(
          (sub) =>
            sub.user_id === user.user_id && sub.submission_date === "2024-01-15"
        );
        submission_status_map[user.user_id] = has_submission;
      }
    }

    // Act: Run agent
    const agent_result = await runTx2Imp1Agent({
      ai_client: fake_ai_client,
      mail_service: stub_mail_service,
      audit_logger: mock_audit_logger,
      submission_status: submission_status_map,
      user_id_to_name: user_id_to_name_map,
      deadline_timestamp: SUBMISSION_DEADLINE,
      current_timestamp: MONITOR_TIMESTAMP,
      manager_email: MANAGER_EMAIL,
    });

    // Assert: Verify unsubmitted members list is created
    expect(agent_result.unsubmitted_members).toHaveLength(2);
    expect(agent_result.unsubmitted_members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "user_eng_009",
          user_name: "太郎",
        }),
        expect.objectContaining({
          user_id: "user_eng_010",
          user_name: "花子",
        }),
      ])
    );

    // Assert: Verify delayed members list is empty
    expect(agent_result.delayed_members).toHaveLength(0);

    // Assert: Verify judgment timestamp
    expect(agent_result.judgment_timestamp).toBe(MONITOR_TIMESTAMP);

    // Assert: Verify notification email was sent to manager
    const sent_emails = stub_mail_service.get_sent_emails();
    expect(sent_emails).toHaveLength(1);
    expect(sent_emails[0].to).toBe(MANAGER_EMAIL);
    expect(sent_emails[0].subject).toMatch(/報告漏れ/);

    // Assert: Verify email body contains unsubmitted member names
    expect(sent_emails[0].body).toContain("太郎");
    expect(sent_emails[0].body).toContain("花子");
    expect(sent_emails[0].body).toMatch(/未提出/);

    // Assert: Verify audit log records the completed task
    const audit_entries = mock_audit_logger.get_log_entries();
    expect(audit_entries).toHaveLength(1);
    expect(audit_entries[0]).toEqual(
      expect.objectContaining({
        task_name: "報告漏れ・遅延部員の一覧を作成する",
        status: "completed",
        agent_action: "create_unsubmitted_list",
      })
    );
    expect(audit_entries[0].timestamp).toBe(MONITOR_TIMESTAMP);
  });
});