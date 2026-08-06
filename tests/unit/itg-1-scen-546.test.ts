import { runTx2Imp1Agent, Tx2Imp1AiClient } from "../../src/logic/it-1";

describe("日報収集から報告漏れ特定までの自動判定と通知", () => {
  // SCEN-546
  test("should automatically identify unreported staff and notify manager via email", async () => {
    // Setup: Initialize 10 staff members with no reports submitted
    const staff_members = [
      {
        user_id: "usr_001",
        name: "田中太郎",
        department: "開発部",
        email: "tanaka@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_002",
        name: "佐藤花子",
        department: "開発部",
        email: "sato@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_003",
        name: "鈴木次郎",
        department: "開発部",
        email: "suzuki@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_004",
        name: "高橋美咲",
        department: "開発部",
        email: "takahashi@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_005",
        name: "伊藤健太",
        department: "開発部",
        email: "itou@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_006",
        name: "渡辺由美",
        department: "開発部",
        email: "watanabe@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_007",
        name: "中村拓也",
        department: "開発部",
        email: "nakamura@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_008",
        name: "山田優子",
        department: "開発部",
        email: "yamada@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_009",
        name: "小林翔太",
        department: "開発部",
        email: "kobayashi@example.com",
        role: "engineer",
      },
      {
        user_id: "usr_010",
        name: "木村美香",
        department: "開発部",
        email: "kimura@example.com",
        role: "engineer",
      },
    ];

    const manager = {
      user_id: "mgr_001",
      name: "山本部長",
      department: "開発部",
      email: "yamamoto-manager@example.com",
      role: "manager",
    };

    // Setup: 9 staff members have submitted reports, 1 remains unreported
    const submitted_reports = [
      {
        user_id: "usr_001",
        submitted_at: "2024-01-15T07:30:00Z",
        yesterday_achievement: "API実装完了",
        today_plan: "テスト実施",
        current_issues: "なし",
      },
      {
        user_id: "usr_002",
        submitted_at: "2024-01-15T07:35:00Z",
        yesterday_achievement: "DB設計完了",
        today_plan: "実装開始",
        current_issues: "なし",
      },
      {
        user_id: "usr_003",
        submitted_at: "2024-01-15T07:40:00Z",
        yesterday_achievement: "ドキュメント作成",
        today_plan: "レビュー対応",
        current_issues: "なし",
      },
      {
        user_id: "usr_004",
        submitted_at: "2024-01-15T07:45:00Z",
        yesterday_achievement: "バグ修正",
        today_plan: "テスト実施",
        current_issues: "なし",
      },
      {
        user_id: "usr_005",
        submitted_at: "2024-01-15T07:50:00Z",
        yesterday_achievement: "機能開発",
        today_plan: "テスト実施",
        current_issues: "なし",
      },
      {
        user_id: "usr_006",
        submitted_at: "2024-01-15T07:55:00Z",
        yesterday_achievement: "インフラ構築",
        today_plan: "監視設定",
        current_issues: "なし",
      },
      {
        user_id: "usr_007",
        submitted_at: "2024-01-15T08:00:00Z",
        yesterday_achievement: "QA実施",
        today_plan: "テスト続行",
        current_issues: "なし",
      },
      {
        user_id: "usr_008",
        submitted_at: "2024-01-15T08:05:00Z",
        yesterday_achievement: "デプロイ実施",
        today_plan: "監視確認",
        current_issues: "なし",
      },
      {
        user_id: "usr_009",
        submitted_at: "2024-01-15T08:10:00Z",
        yesterday_achievement: "ミーティング実施",
        today_plan: "進捗確認",
        current_issues: "なし",
      },
    ];

    // usr_010 has not submitted
    const unreported_staff = staff_members.find((s) => s.user_id === "usr_010");

    // Setup: Configure scheduled check time (morning meeting start - 30 minutes = 08:30 JST)
    const meeting_start_time = "2024-01-15T08:30:00Z";
    const check_execution_time = "2024-01-15T08:00:00Z";
    const submission_deadline = "2024-01-15T08:30:00Z";

    // Mock AI Client
    const sent_emails: Array<{
      recipient: string;
      subject: string;
      body: string;
      sent_at: string;
    }> = [];

    const mock_ai_client: Tx2Imp1AiClient = {
      sendNotificationEmail: async (params) => {
        const email_record = {
          recipient: params.recipient_email,
          subject: params.subject,
          body: params.body,
          sent_at: new Date().toISOString(),
        };
        sent_emails.push(email_record);
        return {
          success: true,
          message_id: `msg_${Date.now()}`,
          sent_timestamp: new Date().toISOString(),
        };
      },
    };

    // Execute: Run agent at scheduled time
    const agent_result = await runTx2Imp1Agent({
      staff_list: staff_members,
      manager_info: manager,
      submitted_reports: submitted_reports,
      check_execution_time: check_execution_time,
      submission_deadline: submission_deadline,
      ai_client: mock_ai_client,
    });

    // Verify: Agent identifies 1 unreported staff member
    expect(agent_result.unreported_count).toBe(1);
    expect(agent_result.unreported_staff).toHaveLength(1);

    const detected_unreported = agent_result.unreported_staff[0];
    expect(detected_unreported.user_id).toBe("usr_010");
    expect(detected_unreported.name).toBe("木村美香");
    expect(detected_unreported.department).toBe("開発部");

    // Verify: Notification email was sent to manager
    expect(sent_emails).toHaveLength(1);

    const notification_email = sent_emails[0];
    expect(notification_email.recipient).toBe(manager.email);
    expect(notification_email.subject).toContain("日報未提出者通知");
    expect(notification_email.body).toContain("木村美香");
    expect(notification_email.body).toContain("開発部");

    // Verify: Submission record reflects correct counts
    expect(agent_result.submitted_count).toBe(9);
    expect(agent_result.total_staff).toBe(10);

    // Verify: Agent execution succeeded
    expect(agent_result.status).toBe("completed");
    expect(agent_result.notification_sent).toBe(true);

    // Verify: Audit log entry created
    expect(agent_result.audit_log_entry).toBeDefined();
    expect(agent_result.audit_log_entry.action).toBe("send_notification_email");
    expect(agent_result.audit_log_entry.status).toBe("completed");
    expect(agent_result.audit_log_entry.unreported_count).toBe(1);
    expect(agent_result.audit_log_entry.timestamp).toBeDefined();
  });
});