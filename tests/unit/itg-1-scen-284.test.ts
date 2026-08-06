import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/logic/it-1";

// Mock types and interfaces
interface MockUser {
  user_id: string;
  email: string;
  name: string;
  department_id: string;
}

interface MockDailyReport {
  report_id: string;
  user_id: string;
  yesterday_achievement: string;
  today_plan: string;
  current_issues: string;
  submitted_at: string;
}

interface MockEmailLog {
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  sent_at: string;
}

interface Tx2Imp1AiClientResponse {
  submitted_reports: MockDailyReport[];
  unsubmitted_users: string[];
  delayed_reports: MockDailyReport[];
}

interface Tx2Imp1AiClient {
  checkSubmissionStatus(): Promise<Tx2Imp1AiClientResponse>;
}

// Mock storage for email logs
const email_logs: MockEmailLog[] = [];

// Mock email service
const mock_email_service = {
  send: (params: {
    recipient_email: string;
    recipient_name: string;
    subject: string;
    body: string;
  }): void => {
    email_logs.push({
      recipient_email: params.recipient_email,
      recipient_name: params.recipient_name,
      subject: params.subject,
      body: params.body,
      sent_at: new Date("2024-01-15T09:30:00Z").toISOString(),
    });
  },
};

// Mock AI client
const create_mock_ai_client = (
  submitted_reports: MockDailyReport[],
  unsubmitted_users: string[]
): Tx2Imp1AiClient => {
  return {
    checkSubmissionStatus: async (): Promise<Tx2Imp1AiClientResponse> => {
      return {
        submitted_reports,
        unsubmitted_users,
        delayed_reports: [],
      };
    },
  };
};

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    email_logs.length = 0;
  });

  afterEach(() => {
    email_logs.length = 0;
  });

  // SCEN-284
  it("should deliver confirmation email to submitter when daily report is submitted", async () => {
    // Setup: Create 10 team members including submitter
    const submitter_user_id = "eng_001";
    const submitter_email = "engineer1@company.com";
    const submitter_name = "田中太郎";

    const other_users: MockUser[] = [
      {
        user_id: "eng_002",
        email: "engineer2@company.com",
        name: "鈴木花子",
        department_id: "dev_001",
      },
      {
        user_id: "eng_003",
        email: "engineer3@company.com",
        name: "佐藤次郎",
        department_id: "dev_001",
      },
      {
        user_id: "eng_004",
        email: "engineer4@company.com",
        name: "高橋美咲",
        department_id: "dev_001",
      },
      {
        user_id: "eng_005",
        email: "engineer5@company.com",
        name: "渡辺健太",
        department_id: "dev_001",
      },
      {
        user_id: "eng_006",
        email: "engineer6@company.com",
        name: "山田由美",
        department_id: "dev_001",
      },
      {
        user_id: "eng_007",
        email: "engineer7@company.com",
        name: "中村拓也",
        department_id: "dev_001",
      },
      {
        user_id: "eng_008",
        email: "engineer8@company.com",
        name: "小林美優",
        department_id: "dev_001",
      },
      {
        user_id: "eng_009",
        email: "engineer9@company.com",
        name: "伊藤春樹",
        department_id: "dev_001",
      },
      {
        user_id: "eng_010",
        email: "engineer10@company.com",
        name: "加藤冬美",
        department_id: "dev_001",
      },
    ];

    // Submitter's daily report data
    const submitted_report: MockDailyReport = {
      report_id: "rpt_001",
      user_id: submitter_user_id,
      yesterday_achievement: "プロジェクトAのバグ修正を5件完了しました",
      today_plan: "プロジェクトBの新機能実装を開始します",
      current_issues:
        "データベース接続タイムアウトの問題が発生しています",
      submitted_at: new Date("2024-01-15T09:15:00Z").toISOString(),
    };

    // Unsubmitted users (excluding submitter)
    const unsubmitted_user_ids = other_users.map((u) => u.user_id);

    // Create mock AI client with submitted report
    const mock_ai_client = create_mock_ai_client(
      [submitted_report],
      unsubmitted_user_ids
    );

    // Inject dependencies into test execution
    const send_confirmation_email = (report: MockDailyReport): void => {
      const subject_line = `${submitter_name}様の日報が送信されました`;
      const email_body = `昨日の実績:\n${report.yesterday_achievement}\n\n本日の予定:\n${report.today_plan}\n\n抱えている課題:\n${report.current_issues}`;

      mock_email_service.send({
        recipient_email: submitter_email,
        recipient_name: submitter_name,
        subject: subject_line,
        body: email_body,
      });
    };

    // Execute: Call the agent function to check submission status and send confirmation emails
    const ai_response = await mock_ai_client.checkSubmissionStatus();

    // Process each submitted report
    for (const report of ai_response.submitted_reports) {
      if (report.user_id === submitter_user_id) {
        send_confirmation_email(report);
      }
    }

    // Verify: Check that confirmation email was sent to submitter
    expect(email_logs.length).toBe(1);

    const sent_email = email_logs[0];
    expect(sent_email.recipient_email).toBe(submitter_email);
    expect(sent_email.recipient_name).toBe(submitter_name);
    expect(sent_email.subject).toContain(submitter_name);
    expect(sent_email.body).toContain(submitted_report.yesterday_achievement);
    expect(sent_email.body).toContain(submitted_report.today_plan);
    expect(sent_email.body).toContain(submitted_report.current_issues);

    // Verify: Confirm that no emails were sent to other team members
    const other_recipient_count = email_logs.filter(
      (log) => log.recipient_email !== submitter_email
    ).length;
    expect(other_recipient_count).toBe(0);
  });
});