import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  runTx1Imp1Agent,
  Tx1Imp1AiClient,
  ReportSubmissionInput,
  AgentExecutionResult,
  AuditLogEntry,
} from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  let fake_ai_client: Tx1Imp1AiClient;
  let audit_log: AuditLogEntry[];
  let submitted_report_id: string;

  beforeEach(() => {
    audit_log = [];
    submitted_report_id = "";

    fake_ai_client = {
      validateReportContent: jest.fn(async (content) => {
        return {
          is_valid: true,
          validation_errors: [],
        };
      }),

      determineNextAction: jest.fn(async (context) => {
        const submission_time = new Date(context.submission_timestamp);
        const deadline = new Date(context.deadline);
        const hours_late = (submission_time.getTime() - deadline.getTime()) / (1000 * 60 * 60);

        if (hours_late >= 24) {
          return {
            next_action: "ESCALATE_TO_HUMAN",
            escalation_reason: "SUBMISSION_DEADLINE_SIGNIFICANTLY_EXCEEDED",
            should_send_confirmation_email: false,
            should_send_reminder_notification: false,
          };
        }

        return {
          next_action: "PROCEED_WITH_CONFIRMATION_EMAIL",
          escalation_reason: null,
          should_send_confirmation_email: true,
          should_send_reminder_notification: false,
        };
      }),

      recordAuditLog: jest.fn(async (log_entry) => {
        audit_log.push(log_entry);
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-534
  it("should escalate to human without executing side effects when submission deadline is significantly exceeded", async () => {
    const deadline_timestamp = "2024-01-15T09:00:00Z";
    const submission_timestamp = "2024-01-16T09:30:00Z"; // 25.5 hours late

    const report_input: ReportSubmissionInput = {
      engineer_id: "ENG-A001",
      engineer_name: "エンジニアA",
      department_id: "DEV-001",
      yesterday_accomplishments:
        "タスク1を完了しました。テストコードを100行追加しました。",
      todays_plan: "タスク2を開始します。API設計を完了します。",
      current_issues: "ローカル環境での再現が困難な不具合が1件あります。",
      submission_timestamp: submission_timestamp,
      deadline: deadline_timestamp,
    };

    const result: AgentExecutionResult = await runTx1Imp1Agent(
      report_input,
      fake_ai_client
    );

    expect(result.status).toBe("ESCALATED_TO_HUMAN");
    expect(result.report_id).toBeTruthy();
    submitted_report_id = result.report_id;

    expect(result.actions_executed).toEqual({
      content_validation: true,
      system_registration: true,
      confirmation_email_sent: false,
      reminder_notification_sent: false,
    });

    expect(result.escalation_triggered).toBe(true);
    expect(result.escalation_reason).toBe(
      "SUBMISSION_DEADLINE_SIGNIFICANTLY_EXCEEDED"
    );

    const escalation_audit_entry = audit_log.find(
      (log) => log.audit_type === "ESCALATION_INITIATED"
    );
    expect(escalation_audit_entry).toBeDefined();
    expect(escalation_audit_entry!.payload).toEqual({
      reason: "SUBMISSION_DEADLINE_SIGNIFICANTLY_EXCEEDED",
      engineer_id: "ENG-A001",
      engineer_name: "エンジニアA",
      report_id: submitted_report_id,
      submission_timestamp: submission_timestamp,
      deadline: deadline_timestamp,
      hours_late: 25.5,
      recommended_action: "AWAIT_MANAGER_DECISION",
    });

    const confirmation_email_log = audit_log.find(
      (log) => log.audit_type === "CONFIRMATION_EMAIL_SENT"
    );
    expect(confirmation_email_log).toBeUndefined();

    const reminder_notification_log = audit_log.find(
      (log) => log.audit_type === "REMINDER_NOTIFICATION_SENT"
    );
    expect(reminder_notification_log).toBeUndefined();

    const registration_audit_entry = audit_log.find(
      (log) => log.audit_type === "REPORT_REGISTERED"
    );
    expect(registration_audit_entry).toBeDefined();
    expect(registration_audit_entry!.payload.report_id).toBe(submitted_report_id);
    expect(registration_audit_entry!.payload.engineer_id).toBe("ENG-A001");

    expect(fake_ai_client.validateReportContent).toHaveBeenCalledWith({
      yesterday_accomplishments:
        "タスク1を完了しました。テストコードを100行追加しました。",
      todays_plan: "タスク2を開始します。API設計を完了します。",
      current_issues: "ローカル環境での再現が困難な不具合が1件あります。",
    });

    expect(fake_ai_client.determineNextAction).toHaveBeenCalledWith({
      submission_timestamp: submission_timestamp,
      deadline: deadline_timestamp,
      validation_passed: true,
      report_registered: true,
    });

    const total_audit_count = audit_log.length;
    expect(total_audit_count).toBeGreaterThanOrEqual(2);
  });
});