import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("日報収集から報告漏れ特定までの自動判定と通知 AIエージェント - エスカレーション処理", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-548
  test("特定部員の報告漏れが繰り返される場合にエスカレーションして人へ引き継ぐ", async () => {
    // ================== Setup: テストデータベース初期化 ==================
    const test_db = {
      users: [
        {
          user_id: "user_001",
          user_name: "部長太郎",
          role: "manager",
          department_id: "dept_dev",
        },
        {
          user_id: "user_101",
          user_name: "部員A",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_102",
          user_name: "部員B",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_103",
          user_name: "部員C",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_104",
          user_name: "部員D",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_105",
          user_name: "部員E",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_106",
          user_name: "部員F",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_107",
          user_name: "部員G",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_108",
          user_name: "部員H",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_109",
          user_name: "部員I",
          role: "engineer",
          department_id: "dept_dev",
        },
        {
          user_id: "user_110",
          user_name: "部員J",
          role: "engineer",
          department_id: "dept_dev",
        },
      ],
      departments: [
        {
          department_id: "dept_dev",
          department_name: "開発部",
        },
      ],
      reports: [
        {
          report_id: "report_101",
          user_id: "user_101",
          report_date: "2024-01-15",
          yesterday_achievement: "タスク A を完了",
          today_plan: "タスク B を開始",
          issues: "なし",
          submitted_at: "2024-01-15T07:30:00Z",
        },
        {
          report_id: "report_102",
          user_id: "user_102",
          report_date: "2024-01-15",
          yesterday_achievement: "タスク C を完了",
          today_plan: "タスク D を開始",
          issues: "なし",
          submitted_at: "2024-01-15T07:45:00Z",
        },
        {
          report_id: "report_103",
          user_id: "user_103",
          report_date: "2024-01-15",
          yesterday_achievement: "タスク E を完了",
          today_plan: "タスク F を開始",
          issues: "なし",
          submitted_at: "2024-01-15T07:50:00Z",
        },
        {
          report_id: "report_104",
          user_id: "user_104",
          report_date: "2024-01-15",
          yesterday_achievement: "タスク G を完了",
          today_plan: "タスク H を開始",
          issues: "なし",
          submitted_at: "2024-01-15T08:00:00Z",
        },
        {
          report_id: "report_105",
          user_id: "user_105",
          report_date: "2024-01-15",
          yesterday_achievement: "タスク I を完了",
          today_plan: "タスク J を開始",
          issues: "なし",
          submitted_at: "2024-01-15T08:05:00Z",
        },
      ],
      missing_report_history: [
        {
          missing_id: "missing_001",
          user_id: "user_101",
          missing_date: "2023-12-20",
          recorded_at: "2023-12-20T08:30:00Z",
        },
        {
          missing_id: "missing_002",
          user_id: "user_101",
          missing_date: "2024-01-05",
          recorded_at: "2024-01-05T08:30:00Z",
        },
        {
          missing_id: "missing_003",
          user_id: "user_101",
          missing_date: "2024-01-10",
          recorded_at: "2024-01-10T08:30:00Z",
        },
      ],
      escalation_logs: [],
      audit_logs: [],
      email_logs: [],
    };

    const morning_check_time = new Date("2024-01-15T08:00:00Z");
    const morning_deadline_time = new Date("2024-01-15T08:00:00Z");

    const missing_user_ids = ["user_106", "user_107", "user_108", "user_109", "user_110"];
    const repeated_missing_user_id = "user_101";

    // ================== Mock AI Client ==================
    const mock_ai_client = {
      analyzeReportStatus: jest.fn(),
    };

    const ai_response = {
      escalation_condition: "REPEATED_MISSING_REPORT",
      missing_users: missing_user_ids.map((uid) => {
        const user = test_db.users.find((u) => u.user_id === uid);
        return {
          user_id: uid,
          user_name: user?.user_name,
          department_id: user?.department_id,
        };
      }),
      repeated_missing_user: {
        user_id: repeated_missing_user_id,
        user_name: "部員A",
        department_id: "dept_dev",
        missing_count: 3,
        recent_missing_dates: [
          "2023-12-20T08:30:00Z",
          "2024-01-05T08:30:00Z",
          "2024-01-10T08:30:00Z",
        ],
      },
      ai_recommendation: "対応方針の決定待ち",
      ai_confidence: "high",
    };

    mock_ai_client.analyzeReportStatus.mockResolvedValue(ai_response);

    // ================== Execute Agent ==================
    const agent_input = {
      check_time: morning_check_time,
      deadline_time: morning_deadline_time,
      reports: test_db.reports,
      all_users: test_db.users,
      missing_report_history: test_db.missing_report_history,
      manager_user_id: "user_001",
      ai_client: mock_ai_client,
    };

    // ================== Call the Agent Function ==================
    let agent_result;
    let escalation_error;

    try {
      agent_result = await runTx2Imp1Agent(agent_input);
    } catch (error) {
      escalation_error = error;
    }

    // ================== Verification: Escalation State ==================
    // (1) エスカレーション状態がPENDING_HUMAN_DECISIONで保持されていることを確認
    expect(agent_result).toBeDefined();
    expect(agent_result.escalation_state).toBe("PENDING_HUMAN_DECISION");
    expect(agent_result.escalation_reason).toBe("REPEATED_MISSING_REPORT");

    // ================== Verification: Missing Users List ==================
    // (2) 未送信部員5名の情報がエスカレーション通知に含まれていることを確認
    expect(agent_result.missing_users_list).toBeDefined();
    expect(agent_result.missing_users_list).toHaveLength(5);
    expect(agent_result.missing_users_list.map((u) => u.user_id)).toEqual(
      expect.arrayContaining(missing_user_ids)
    );

    for (const missing_user of agent_result.missing_users_list) {
      expect(missing_user.user_name).toBeDefined();
      expect(missing_user.department_id).toBeDefined();
    }

    // ================== Verification: Repeated Missing User History ==================
    // (3) 部員Aの繰り返し報告漏れの履歴情報がエスカレーション通知に含まれていることを確認
    expect(agent_result.repeated_missing_info).toBeDefined();
    expect(agent_result.repeated_missing_info.user_id).toBe("user_101");
    expect(agent_result.repeated_missing_info.user_name).toBe("部員A");
    expect(agent_result.repeated_missing_info.missing_count).toBe(3);
    expect(agent_result.repeated_missing_info.recent_missing_dates).toEqual([
      "2023-12-20T08:30:00Z",
      "2024-01-05T08:30:00Z",
      "2024-01-10T08:30:00Z",
    ]);

    // ================== Verification: Manager Email Notification ==================
    // (4) 部長へのエスカレーション通知メールが送信されていることを確認
    expect(agent_result.escalation_notification_email).toBeDefined();
    expect(agent_result.escalation_notification_email.recipient_user_id).toBe("user_001");
    expect(agent_result.escalation_notification_email.status).toBe("sent");

    const email_body = agent_result.escalation_notification_email.body;
    expect(email_body).toContain("部員A");
    expect(email_body).toContain("3回");
    expect(email_body).toContain("対応方針の決定待ち");
    expect(email_body).toContain("2023-12-20");
    expect(email_body).toContain("2024-01-05");
    expect(email_body).toContain("2024-01-10");

    // ================== Verification: Manager Review Form Link ==================
    // (5) 部長確認フォームへのリンクがメールに含まれていることを確認
    expect(agent_result.escalation_notification_email.manager_review_form_url).toBeDefined();
    expect(agent_result.escalation_notification_email.manager_review_form_url).toMatch(
      /escalation_id=/
    );

    // ================== Verification: Escalation Record in Database ==================
    // (6) データベース内のエスカレーションレコードが正しく記録されていることを確認
    expect(agent_result.escalation_record).toBeDefined();
    expect(agent_result.escalation_record.escalation_state).toBe("PENDING_HUMAN_DECISION");
    expect(agent_result.escalation_record.escalation_reason).toBe("REPEATED_MISSING_REPORT");
    expect(agent_result.escalation_record.escalation_time).toBeDefined();
    expect(agent_result.escalation_record.manager_user_id).toBe("user_001");

    // ================== Verification: No Autonomous Actions Executed ==================
    // (7) 自動対応（報告漏れ一覧の確定作成、自動催促メール送信）が実行されていないことを確認
    expect(agent_result.final_missing_report_list).toBeUndefined();
    expect(agent_result.auto_reminder_emails_sent).toBeUndefined();
    expect(agent_result.confirmation_email_sent).toBe(false);

    // ================== Verification: Audit Logs ==================
    // (8) Audit logに『ESCALATION_INITIATED』『HUMAN_REVIEW_REQUIRED』イベントが記録されていることを確認
    expect(agent_result.audit_logs).toBeDefined();
    expect(agent_result.audit_logs).toHaveLength(2);

    const escalation_initiated_log = agent_result.audit_logs.find(
      (log) => log.event_type === "ESCALATION_INITIATED"
    );
    expect(escalation_initiated_log).toBeDefined();
    expect(escalation_initiated_log.escalation_reason).toBe("REPEATED_MISSING_REPORT");
    expect(escalation_initiated_log.timestamp).toBeDefined();

    const human_review_log = agent_result.audit_logs.find(
      (log) => log.event_type === "HUMAN_REVIEW_REQUIRED"
    );
    expect(human_review_log).toBeDefined();
    expect(human_review_log.escalation_id).toBeDefined();
    expect(human_review_log.timestamp).toBeDefined();

    // ================== Verification: No Side Effects Before Approval ==================
    // (9) エスカレーション解決前に副作用（メール送信・一覧確定）が実行されていないことを確認
    expect(agent_result.side_effects_executed).toBe(false);
    expect(agent_result.pending_autonomous_actions).toEqual(
      expect.objectContaining({
        action_1: "create_final_missing_report_list",
        action_2: "send_reminder_emails",
        action_3: "send_confirmation_email",
      })
    );

    // ================== Human Approval Simulation ==================
    // (10) 部長がWebUIから対応方針を入力して承認ボタンを押したシミュレーション
    const manager_decision = {
      escalation_id: agent_result.escalation_record.escalation_id,
      decision_text: "部員A に対して注意指導を実施",
      approved_by: "user_001",
      approved_at: "2024-01-15T08:15:00Z",
    };

    const manager_approval_result = await agent_result.resumeAfterManagerApproval(
      manager_decision
    );

    // ================== Verification: Manager Decision Recorded ==================
    // (11) 部長の決定がデータベースに記録されたことを確認
    expect(manager_approval_result.manager_decision_recorded).toBe(true);
    expect(manager_approval_result.recorded_decision.decision_text).toBe(
      "部員A に対して注意指導を実施"
    );
    expect(manager_approval_result.recorded_decision.approved_by).toBe("user_001");

    // ================== Verification: Orchestrator Resumable ==================
    // (12) Orchestrator再開可能な状態に遷移していることを確認
    expect(manager_approval_result.escalation_state).toBe("APPROVED");
    expect(manager_approval_result.can_resume_orchestrator).toBe(true);
    expect(manager_approval_result.pending_autonomous_actions).toBeDefined();

    // ================== Verification: Subsequent Actions After Approval ==================
    // (13) 部長の確認入力後、承認された対応方針に基づいて次ステップが実行されることを確認
    const resumed_result = await manager_approval_result.executeApprovedActions();

    expect(resumed_result.execution_status).toBe("completed");
    expect(resumed_result.actions_executed).toHaveLength(3);
    expect(resumed_result.actions_executed).toEqual(
      expect.arrayContaining([
        "create_final_missing_report_list",
        "send_reminder_emails",
        "send_confirmation_email",
      ])
    );

    // ================== Verification: Final Side Effects Executed ==================
    // (14) エスカレーション解決後の副作用が正しく実行されていることを確認
    expect(resumed_result.final_missing_report_list).toBeDefined();
    expect(resumed_result.reminder_emails_sent_count).toBe(5);
    expect(resumed_result.confirmation_email_sent).toBe(true);

    // ================== Verification: Audit Log Completion ==================
    // (15) 最終的なAudit logに『MANAGER_APPROVAL_RECORDED』『ORCHESTRATOR_RESUMED』イベントが追加されていることを確認
    expect(resumed_result.final_audit_logs).toBeDefined();
    expect(resumed_result.final_audit_logs.length).toBeGreaterThan(2);

    const manager_approval_log = resumed_result.final_audit_logs.find(
      (log) => log.event_type === "MANAGER_APPROVAL_RECORDED"
    );
    expect(manager_approval_log).toBeDefined();

    const orchestrator_resumed_log = resumed_result.final_audit_logs.find(
      (log) => log.event_type === "ORCHESTRATOR_RESUMED"
    );
    expect(orchestrator_resumed_log).toBeDefined();
  });
});