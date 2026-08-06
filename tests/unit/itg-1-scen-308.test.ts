import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";

describe("報告送信時に確認メール自動配信 - メール送信失敗時のエラーハンドリング", () => {
  // SCEN-308
  test("メール送信サービスが失敗を返したとき、エージェントは処理を中断しエラー例外を発生させる", async () => {
    // ===== Setup: テスト用のメール送信サービススタブとログシステム =====
    const audit_log_events: Array<{
      event_type: string;
      timestamp: string;
      details: string;
    }> = [];

    const mock_audit_logger = {
      log: (
        event_type: string,
        details: string
      ): void => {
        audit_log_events.push({
          event_type,
          timestamp: "2024-01-15T09:30:00Z",
          details,
        });
      },
    };

    const mock_mail_service = {
      send: jest.fn().mockResolvedValue({
        success: false,
        error: "SMTP_FAILURE",
        message: "メール送信サービスが応答しません",
      }),
    };

    const mock_ai_client: Tx2Imp1AiClient = {
      analyzeReportingStatus: jest.fn().mockResolvedValue({
        missing_reporters: [
          {
            user_id: "engineer_003",
            user_name: "田中太郎",
            status: "未送信",
          },
        ],
        delayed_reporters: [
          {
            user_id: "engineer_005",
            user_name: "佐藤次郎",
            status: "遅延",
            submission_time: "2024-01-15T08:45:00Z",
          },
        ],
      }),
      generateNotificationContent: jest.fn().mockResolvedValue({
        subject: "日報送信状況：未送信・遅延部員がいます",
        body: "未送信者1名、遅延者1名が確認されました",
      }),
    };

    // ===== Setup: 前提条件の整備 =====
    const reporting_status_data = {
      department_id: "dev_01",
      department_name: "開発部",
      total_members: 10,
      submitted_count: 8,
      submission_deadline: "2024-01-15T08:30:00Z",
      submitted_reports: [
        {
          user_id: "engineer_001",
          user_name: "佐藤花子",
          submission_time: "2024-01-15T08:20:00Z",
        },
        {
          user_id: "engineer_002",
          user_name: "鈴木次郎",
          submission_time: "2024-01-15T08:25:00Z",
        },
        {
          user_id: "engineer_004",
          user_name: "高橋三郎",
          submission_time: "2024-01-15T08:30:00Z",
        },
        {
          user_id: "engineer_006",
          user_name: "伊藤四郎",
          submission_time: "2024-01-15T08:15:00Z",
        },
        {
          user_id: "engineer_007",
          user_name: "渡辺五郎",
          submission_time: "2024-01-15T08:20:00Z",
        },
        {
          user_id: "engineer_008",
          user_name: "中村六郎",
          submission_time: "2024-01-15T08:28:00Z",
        },
        {
          user_id: "engineer_009",
          user_name: "小林七郎",
          submission_time: "2024-01-15T08:22:00Z",
        },
        {
          user_id: "engineer_010",
          user_name: "加藤八郎",
          submission_time: "2024-01-15T08:29:00Z",
        },
      ],
    };

    const manager_contact = {
      user_id: "manager_001",
      email: "manager@company.com",
      name: "部長太郎",
    };

    const agency_config = {
      execution_time: "2024-01-15T08:35:00Z",
      audit_logger: mock_audit_logger,
      mail_service: mock_mail_service,
      ai_client: mock_ai_client,
    };

    // ===== Execute: runTx2Imp1Agent を呼び出し、メール送信失敗を検証 =====
    const execution_fn = async () => {
      return await runTx2Imp1Agent(
        reporting_status_data,
        manager_contact,
        agency_config
      );
    };

    // ===== Assertion 1: メール送信失敗によるエラー例外が発生すること =====
    await expect(execution_fn).rejects.toThrow(/メール送信失敗/);

    // ===== Assertion 2: エラーメッセージに失敗原因が特定できるテキストが含まれること =====
    try {
      await execution_fn();
    } catch (err) {
      const error_message = (err as Error).message;
      expect(error_message).toMatch(
        /報告漏れ・遅延部員への通知に失敗|メール送信|SMTP_FAILURE/
      );
    }

    // ===== Assertion 3: メール送信サービスが呼び出されたことを確認 =====
    expect(mock_mail_service.send).toHaveBeenCalled();

    // ===== Assertion 4: 監査ログに失敗イベントが記録されていること =====
    expect(audit_log_events.length).toBeGreaterThan(0);
    const failure_log = audit_log_events.find((log) =>
      log.event_type.includes("MAIL_SEND_FAILURE") ||
      log.event_type.includes("NOTIFICATION_FAILURE")
    );
    expect(failure_log).toBeDefined();
    if (failure_log) {
      expect(failure_log.details).toMatch(/メール送信|SMTP/);
    }

    // ===== Assertion 5: メール送信失敗時に後続処理（ログ記録、DB更新など）が実行されないこと =====
    // AI クライアントが分析データを生成してもメール送信失敗で中断される
    // つまり、generateNotificationContent が呼ばれても send 失敗で処理が停止
    const logs_after_mail_failure = audit_log_events.filter(
      (log) =>
        log.event_type === "DB_UPDATE_COMPLETED" ||
        log.event_type === "REPORT_LIST_SAVED"
    );
    expect(logs_after_mail_failure).toHaveLength(0);

    // ===== Assertion 6: 処理フロー全体が停止したことを確認（例外発生後の処理がない） =====
    const completion_log = audit_log_events.find(
      (log) => log.event_type === "TX2_IMP1_COMPLETED"
    );
    expect(completion_log).toBeUndefined();
  });
});