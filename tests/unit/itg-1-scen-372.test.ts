import { sendConfirmationEmailsToReporterAndManager } from "../../src/logic/it-1-br-1-1-1";

describe("全員報告完了判定機能 - 日付境界をまたいだ報告送信時の集計", () => {
  test("SCEN-372: 日付境界をまたいで送信された報告を含めて全員報告完了と判定し、確認メールを送信する", () => {
    const morning_session_start_time = new Date("2024-01-15T09:00:00Z");
    const reporter_ids = ["engineer_a", "engineer_b", "engineer_c", "engineer_d", "engineer_e", "engineer_f", "engineer_g", "engineer_h", "engineer_i", "engineer_j"];
    const manager_user_id = "dev_manager_001";

    const submitted_reports = [
      {
        user_id: "engineer_a",
        submitted_at: new Date("2024-01-15T08:50:00Z"),
        yesterday_achievement: "Feature X implementation",
        today_plan: "Code review and testing",
        current_issue: "None",
      },
      {
        user_id: "engineer_b",
        submitted_at: new Date("2024-01-15T08:55:00Z"),
        yesterday_achievement: "Bug fix in module Y",
        today_plan: "Deployment preparation",
        current_issue: "None",
      },
      {
        user_id: "engineer_c",
        submitted_at: new Date("2024-01-15T09:05:00Z"),
        yesterday_achievement: "Documentation update",
        today_plan: "Architecture review",
        current_issue: "None",
      },
      {
        user_id: "engineer_d",
        submitted_at: new Date("2024-01-15T09:10:00Z"),
        yesterday_achievement: "Unit test development",
        today_plan: "Integration testing",
        current_issue: "None",
      },
      {
        user_id: "engineer_e",
        submitted_at: new Date("2024-01-15T09:15:00Z"),
        yesterday_achievement: "Performance optimization",
        today_plan: "Monitoring and tuning",
        current_issue: "None",
      },
      {
        user_id: "engineer_f",
        submitted_at: new Date("2024-01-15T09:20:00Z"),
        yesterday_achievement: "Security patch application",
        today_plan: "Vulnerability assessment",
        current_issue: "None",
      },
      {
        user_id: "engineer_g",
        submitted_at: new Date("2024-01-15T09:25:00Z"),
        yesterday_achievement: "Database migration",
        today_plan: "Data validation",
        current_issue: "None",
      },
      {
        user_id: "engineer_h",
        submitted_at: new Date("2024-01-15T09:30:00Z"),
        yesterday_achievement: "API endpoint development",
        today_plan: "Endpoint testing",
        current_issue: "None",
      },
      {
        user_id: "engineer_i",
        submitted_at: new Date("2024-01-15T23:55:00Z"),
        yesterday_achievement: "Late submission A",
        today_plan: "Continued work",
        current_issue: "None",
      },
      {
        user_id: "engineer_j",
        submitted_at: new Date("2024-01-16T00:05:00Z"),
        yesterday_achievement: "Late submission B",
        today_plan: "Next day work",
        current_issue: "None",
      },
    ];

    const sent_emails = [] as Array<{
      recipient_user_id: string;
      subject: string;
      body: string;
      sent_at: Date;
    }>;

    const mock_email_service = {
      send: jest.fn((recipient_user_id: string, subject: string, body: string) => {
        sent_emails.push({
          recipient_user_id,
          subject,
          body,
          sent_at: new Date(),
        });
        return Promise.resolve({ success: true });
      }),
    };

    const result = sendConfirmationEmailsToReporterAndManager({
      morning_session_start_time,
      reporter_ids,
      manager_user_id,
      submitted_reports,
      email_service: mock_email_service,
    });

    expect(result.all_reporters_submitted).toBe(true);
    expect(result.total_submitted_count).toBe(10);
    expect(sent_emails.length).toBe(11);

    const manager_email = sent_emails.find((email) => email.recipient_user_id === manager_user_id);
    expect(manager_email).toBeDefined();
    expect(manager_email!.body).toMatch(/報告完了/);
    expect(manager_email!.body).toMatch(/10名全員/);

    const reporter_emails = sent_emails.filter((email) => email.recipient_user_id !== manager_user_id);
    expect(reporter_emails.length).toBe(10);

    const engineer_i_email = sent_emails.find((email) => email.recipient_user_id === "engineer_i");
    expect(engineer_i_email).toBeDefined();

    const engineer_j_email = sent_emails.find((email) => email.recipient_user_id === "engineer_j");
    expect(engineer_j_email).toBeDefined();

    expect(mock_email_service.send).toHaveBeenCalledTimes(11);
  });
});