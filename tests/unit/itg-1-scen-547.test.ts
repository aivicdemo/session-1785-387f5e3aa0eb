import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  EscalationNotification,
} from "../../src/agents/tx-2-imp-1/types";

describe("朝会報告管理システム - 日報収集から報告漏れ特定までの自動判定と通知 AIエージェント", () => {
  let mock_ai_client: jest.Mocked<Tx2Imp1AiClient>;
  let mock_audit_logger: {
    log: jest.Mock<void, [event: string, data: unknown]>;
  };
  let mock_mail_queue: {
    enqueue: jest.Mock<Promise<void>, [payload: unknown]>;
  };
  let mock_date_provider: {
    now: jest.Mock<Date, []>;
  };

  beforeEach(() => {
    mock_ai_client = {
      checkDailyReportReceiptStatus: jest.fn(),
      identifyMissingReporters: jest.fn(),
      generateMissingReportersList: jest.fn(),
    };

    mock_audit_logger = {
      log: jest.fn<void, [event: string, data: unknown]>(),
    };

    mock_mail_queue = {
      enqueue: jest.fn<Promise<void>, [payload: unknown]>().mockResolvedValue(undefined),
    };

    mock_date_provider = {
      now: jest.fn<Date, []>().mockReturnValue(new Date("2024-01-15T08:30:00Z")),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-547
  test("should escalate to human when system error occurs during daily report receipt status check", async () => {
    // Arrange
    const agent_input: Tx2Imp1AgentInput = {
      scheduled_check_time: new Date("2024-01-15T08:00:00Z"),
      all_member_user_ids: [
        "ENG001",
        "ENG002",
        "ENG003",
        "ENG004",
        "ENG005",
        "ENG006",
        "ENG007",
        "ENG008",
        "ENG009",
        "ENG010",
      ],
      department_manager_email: "manager@example.com",
    };

    const system_error_message =
      "system error: cannot access daily report database";

    mock_ai_client.checkDailyReportReceiptStatus.mockRejectedValueOnce(
      new Error(system_error_message)
    );

    // Act
    const output: Tx2Imp1AgentOutput = await runTx2Imp1Agent(
      agent_input,
      mock_ai_client,
      mock_audit_logger,
      mock_mail_queue,
      mock_date_provider
    );

    // Assert - Escalation triggered
    expect(output.is_escalated).toBe(true);
    expect(output.escalation_reason).toBe("system_error_daily_report_access");

    // Assert - No side effects executed
    expect(mock_ai_client.identifyMissingReporters).not.toHaveBeenCalled();
    expect(mock_ai_client.generateMissingReportersList).not.toHaveBeenCalled();

    // Assert - Escalation notification payload structure
    const escalation_notification: EscalationNotification =
      output.escalation_notification;
    expect(escalation_notification).toBeDefined();
    expect(escalation_notification.event_type).toBe("ESCALATION_TRIGGERED");
    expect(escalation_notification.agent_contract_id).toBe("tx_2_imp_1");
    expect(escalation_notification.reason).toBe("system_error_daily_report_access");
    expect(escalation_notification.error_message).toContain(
      "cannot access daily report database"
    );
    expect(escalation_notification.execution_timestamp).toEqual(
      new Date("2024-01-15T08:30:00Z")
    );
    expect(escalation_notification.affected_member_count).toBe(10);
    expect(escalation_notification.department_manager_email).toBe(
      "manager@example.com"
    );

    // Assert - Audit log recorded with correct structure
    expect(mock_audit_logger.log).toHaveBeenCalledWith(
      "ESCALATION_TRIGGERED",
      expect.objectContaining({
        agent_contract_id: "tx_2_imp_1",
        reason: "system_error_daily_report_access",
        timestamp: new Date("2024-01-15T08:30:00Z"),
        error_message: system_error_message,
        affected_member_count: 10,
      })
    );

    // Assert - Escalation notification enqueued to manager mail queue
    expect(mock_mail_queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_email: "manager@example.com",
        notification_type: "ESCALATION_REQUIRED",
        agent_contract_id: "tx_2_imp_1",
        escalation_reason: "system_error_daily_report_access",
      })
    );

    // Assert - Agent transitions to human wait state
    expect(output.next_state).toBe("AWAITING_HUMAN_DECISION");
  });
});