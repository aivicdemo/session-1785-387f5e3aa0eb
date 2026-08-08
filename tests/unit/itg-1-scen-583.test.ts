import { type Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { Tx4Imp1AiClientRequest, Tx4Imp1AiClientResponse } from "../../src/agents/tx-4-imp-1/types";
import * as db from "../../src/db";
import * as mailService from "../../src/services/mail";
import * as txLogService from "../../src/services/transaction-log";

// Mock dependencies
jest.mock("../../src/db");
jest.mock("../../src/services/mail");
jest.mock("../../src/services/transaction-log");

describe("日報収集から課題抽出・優先度判定までの自動実行 - 冪等性テスト", () => {
  // SCEN-583
  test("同じ実行IDで再実行した場合、トランザクションと通知が重複しない", async () => {
    // ===== Setup: Mock DB and Services =====
    const exec_id = "exec-001";
    const manager_id = "user-manager-001";
    const report_deadline = new Date("2024-01-15T08:00:00Z");

    const mock_transaction_logs: Array<{
      exec_id: string;
      action_type: string;
      count: number;
    }> = [];
    const mock_mail_send_logs: Array<{
      exec_id: string;
      recipient_id: string;
      mail_type: string;
    }> = [];
    const mock_extracted_issues: Array<{
      exec_id: string;
      issue_id: string;
    }> = [];
    const mock_priority_logs: Array<{
      exec_id: string;
      judgment_result: string;
    }> = [];

    // Mock AI Client - returns consistent responses
    const fake_ai_client: Tx4Imp1AiClient = {
      async extractIssuesAndJudgePriority(
        req: Tx4Imp1AiClientRequest
      ): Promise<Tx4Imp1AiClientResponse> {
        return {
          confirmation_email_sent: 1,
          reports_collected: 10,
          issues_extracted: [
            {
              issue_id: "issue-001",
              title: "Database performance",
              priority: "high",
            },
            {
              issue_id: "issue-002",
              title: "API latency",
              priority: "medium",
            },
            {
              issue_id: "issue-003",
              title: "Documentation gap",
              priority: "low",
            },
          ],
          priority_judgments: [
            {
              issue_id: "issue-001",
              priority_score: 95,
              rank: 1,
            },
            {
              issue_id: "issue-002",
              priority_score: 65,
              rank: 2,
            },
            {
              issue_id: "issue-003",
              priority_score: 30,
              rank: 3,
            },
          ],
          manager_notification_sent: true,
          confidence: 0.98,
        };
      },
    };

    // Mock database operations
    (db.getTransactionLogByExecId as jest.Mock).mockImplementation(
      async (exec_id_param: string) => {
        return mock_transaction_logs.filter(
          (log) => log.exec_id === exec_id_param
        );
      }
    );

    (db.insertTransactionLog as jest.Mock).mockImplementation(
      async (log: {
        exec_id: string;
        action_type: string;
        count: number;
      }) => {
        mock_transaction_logs.push(log);
        return { inserted: true };
      }
    );

    (db.getMailSendLogsByExecId as jest.Mock).mockImplementation(
      async (exec_id_param: string) => {
        return mock_mail_send_logs.filter((log) => log.exec_id === exec_id_param);
      }
    );

    (db.insertMailSendLog as jest.Mock).mockImplementation(
      async (log: {
        exec_id: string;
        recipient_id: string;
        mail_type: string;
      }) => {
        mock_mail_send_logs.push(log);
        return { inserted: true };
      }
    );

    (db.getExtractedIssuesByExecId as jest.Mock).mockImplementation(
      async (exec_id_param: string) => {
        return mock_extracted_issues.filter(
          (issue) => issue.exec_id === exec_id_param
        );
      }
    );

    (db.insertExtractedIssue as jest.Mock).mockImplementation(
      async (issue: { exec_id: string; issue_id: string }) => {
        mock_extracted_issues.push(issue);
        return { inserted: true };
      }
    );

    (db.getPriorityJudgmentLogsByExecId as jest.Mock).mockImplementation(
      async (exec_id_param: string) => {
        return mock_priority_logs.filter((log) => log.exec_id === exec_id_param);
      }
    );

    (db.insertPriorityJudgmentLog as jest.Mock).mockImplementation(
      async (log: { exec_id: string; judgment_result: string }) => {
        mock_priority_logs.push(log);
        return { inserted: true };
      }
    );

    // Mock mail service - count calls to prevent duplicates
    let mail_send_call_count = 0;
    (mailService.sendManagerNotification as jest.Mock).mockImplementation(
      async (_manager_id: string, _report_data: unknown) => {
        mail_send_call_count++;
        return { sent: true, message_id: `msg-${mail_send_call_count}` };
      }
    );

    // ===== First Execution =====
    const first_result = await runTx4Imp1Agent(
      {
        exec_id,
        manager_id,
        report_deadline,
      },
      fake_ai_client
    );

    // Verify first execution result
    expect(first_result.success).toBe(true);
    expect(first_result.exec_id).toBe(exec_id);
    expect(first_result.confirmation_emails_sent).toBe(1);
    expect(first_result.reports_collected).toBe(10);
    expect(first_result.issues_extracted_count).toBe(3);
    expect(first_result.priority_judgments_count).toBe(3);
    expect(first_result.manager_notifications_sent).toBe(1);

    // Capture first execution state
    const first_exec_tx_logs = await db.getTransactionLogByExecId(exec_id);
    const first_exec_mail_logs = await db.getMailSendLogsByExecId(exec_id);
    const first_exec_issues = await db.getExtractedIssuesByExecId(exec_id);
    const first_exec_priority_logs =
      await db.getPriorityJudgmentLogsByExecId(exec_id);

    expect(first_exec_tx_logs.length).toBe(5); // confirmation_email, reports_collected, issues_extracted, priority_judged, manager_notified
    expect(first_exec_mail_logs.length).toBe(1); // manager notification only
    expect(first_exec_issues.length).toBe(3); // 3 issues extracted
    expect(first_exec_priority_logs.length).toBe(1); // 1 judgment record
    expect(mail_send_call_count).toBe(1);

    // Store first execution counts
    const first_tx_log_count = first_exec_tx_logs.length;
    const first_mail_log_count = first_exec_mail_logs.length;
    const first_issue_count = first_exec_issues.length;
    const first_priority_log_count = first_exec_priority_logs.length;
    const first_mail_send_count = mail_send_call_count;

    // ===== Second Execution (Idempotent Retry) =====
    const second_result = await runTx4Imp1Agent(
      {
        exec_id,
        manager_id,
        report_deadline,
      },
      fake_ai_client
    );

    // Verify second execution result
    expect(second_result.success).toBe(true);
    expect(second_result.exec_id).toBe(exec_id);

    // Get post-second-execution state
    const second_exec_tx_logs = await db.getTransactionLogByExecId(exec_id);
    const second_exec_mail_logs = await db.getMailSendLogsByExecId(exec_id);
    const second_exec_issues = await db.getExtractedIssuesByExecId(exec_id);
    const second_exec_priority_logs =
      await db.getPriorityJudgmentLogsByExecId(exec_id);

    // ===== Assertions: Idempotent Verification =====
    // No new transaction logs created on second execution
    expect(second_exec_tx_logs.length).toBe(first_tx_log_count);

    // No new mail logs created on second execution
    expect(second_exec_mail_logs.length).toBe(first_mail_log_count);
    expect(second_exec_mail_logs.length).toBe(1);

    // No new issues extracted on second execution
    expect(second_exec_issues.length).toBe(first_issue_count);
    expect(second_exec_issues.length).toBe(3);

    // No new priority judgment logs on second execution
    expect(second_exec_priority_logs.length).toBe(first_priority_log_count);
    expect(second_exec_priority_logs.length).toBe(1);

    // No additional mail notifications sent
    expect(mail_send_call_count).toBe(first_mail_send_count);
    expect(mail_send_call_count).toBe(1);

    // Verify content integrity: first execution logs remain unchanged
    expect(first_exec_tx_logs[0]).toEqual(second_exec_tx_logs[0]);
    expect(first_exec_mail_logs[0]).toEqual(second_exec_mail_logs[0]);
    expect(first_exec_issues).toEqual(second_exec_issues);
    expect(first_exec_priority_logs[0]).toEqual(second_exec_priority_logs[0]);

    // Verify no duplicate confirmation emails
    const confirmation_email_logs = second_exec_mail_logs.filter(
      (log) => log.mail_type === "confirmation"
    );
    expect(confirmation_email_logs.length).toBe(0); // no duplication

    // Verify manager notification count remains 1
    const manager_notification_logs = second_exec_mail_logs.filter(
      (log) => log.mail_type === "manager_notification"
    );
    expect(manager_notification_logs.length).toBe(1);

    // Verify priority judgment idempotency
    const priority_judgment_result = second_exec_priority_logs[0];
    expect(priority_judgment_result.judgment_result).toEqual(
      first_exec_priority_logs[0].judgment_result
    );
  });
});