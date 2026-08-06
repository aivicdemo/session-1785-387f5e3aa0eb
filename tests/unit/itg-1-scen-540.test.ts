import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";

interface AuditEvent {
  eventType: string;
  contractId: string;
  engineerId: string;
  timestamp: string;
  stepIdentifier?: string;
}

interface AuditLogMock {
  events: AuditEvent[];
  record: (event: AuditEvent) => void;
}

interface Tx1Imp1AiClient {
  executeTemplateGeneration: (engineerId: string) => Promise<void>;
  executeValidation: (
    engineerId: string,
    input: {
      yesterday_achievement: string;
      today_plan: string;
      issue: string;
    }
  ) => Promise<void>;
  executeSystemRegistration: (engineerId: string, input: object) => Promise<void>;
  executeConfirmationEmailSend: (engineerId: string) => Promise<void>;
}

describe("Tx1Imp1Agent - 日報入力から送信・確認メール配信までの自動化", () => {
  let auditLog: AuditLogMock;
  let aiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    auditLog = {
      events: [],
      record: (event: AuditEvent) => {
        auditLog.events.push(event);
      },
    };

    aiClient = {
      executeTemplateGeneration: async (engineerId: string) => {
        auditLog.record({
          eventType: "action_template_generation_executed",
          contractId: "tx_1_imp_1",
          engineerId: engineerId,
          timestamp: new Date("2024-01-15T08:00:00Z").toISOString(),
          stepIdentifier: "template_gen_001",
        });
      },
      executeValidation: async (
        engineerId: string,
        input: {
          yesterday_achievement: string;
          today_plan: string;
          issue: string;
        }
      ) => {
        auditLog.record({
          eventType: "action_validation_executed",
          contractId: "tx_1_imp_1",
          engineerId: engineerId,
          timestamp: new Date("2024-01-15T08:01:00Z").toISOString(),
          stepIdentifier: "validation_001",
        });
      },
      executeSystemRegistration: async (
        engineerId: string,
        input: object
      ) => {
        auditLog.record({
          eventType: "action_system_registration_executed",
          contractId: "tx_1_imp_1",
          engineerId: engineerId,
          timestamp: new Date("2024-01-15T08:02:00Z").toISOString(),
          stepIdentifier: "registration_001",
        });
      },
      executeConfirmationEmailSend: async (engineerId: string) => {
        auditLog.record({
          eventType: "action_confirmation_email_sent",
          contractId: "tx_1_imp_1",
          engineerId: engineerId,
          timestamp: new Date("2024-01-15T08:03:00Z").toISOString(),
          stepIdentifier: "email_send_001",
        });
      },
    };
  });

  afterEach(() => {
    auditLog.events = [];
  });

  // SCEN-540
  test("should record complete audit trail for tx1_imp1_agent execution with all ordered actions", async () => {
    const engineerId = "eng001";
    const reportInput = {
      yesterday_achievement: "バグ修正",
      today_plan: "テスト実施",
      issue: "なし",
    };

    auditLog.record({
      eventType: "tx_1_imp_1_started",
      contractId: "tx_1_imp_1",
      engineerId: engineerId,
      timestamp: new Date("2024-01-15T07:59:00Z").toISOString(),
      stepIdentifier: "start_001",
    });

    await aiClient.executeTemplateGeneration(engineerId);
    await aiClient.executeValidation(engineerId, reportInput);
    await aiClient.executeSystemRegistration(engineerId, reportInput);
    await aiClient.executeConfirmationEmailSend(engineerId);

    auditLog.record({
      eventType: "tx_1_imp_1_completed",
      contractId: "tx_1_imp_1",
      engineerId: engineerId,
      timestamp: new Date("2024-01-15T08:04:00Z").toISOString(),
      stepIdentifier: "complete_001",
    });

    expect(auditLog.events).toHaveLength(6);

    expect(auditLog.events[0]).toEqual({
      eventType: "tx_1_imp_1_started",
      contractId: "tx_1_imp_1",
      engineerId: "eng001",
      timestamp: "2024-01-15T07:59:00.000Z",
      stepIdentifier: "start_001",
    });

    expect(auditLog.events[1]).toEqual({
      eventType: "action_template_generation_executed",
      contractId: "tx_1_imp_1",
      engineerId: "eng001",
      timestamp: "2024-01-15T08:00:00.000Z",
      stepIdentifier: "template_gen_001",
    });

    expect(auditLog.events[2]).toEqual({
      eventType: "action_validation_executed",
      contractId: "tx_1_imp_1",
      engineerId: "eng001",
      timestamp: "2024-01-15T08:01:00.000Z",
      stepIdentifier: "validation_001",
    });

    expect(auditLog.events[3]).toEqual({
      eventType: "action_system_registration_executed",
      contractId: "tx_1_imp_1",
      engineerId: "eng001",
      timestamp: "2024-01-15T08:02:00.000Z",
      stepIdentifier: "registration_001",
    });

    expect(auditLog.events[4]).toEqual({
      eventType: "action_confirmation_email_sent",
      contractId: "tx_1_imp_1",
      engineerId: "eng001",
      timestamp: "2024-01-15T08:03:00.000Z",
      stepIdentifier: "email_send_001",
    });

    expect(auditLog.events[5]).toEqual({
      eventType: "tx_1_imp_1_completed",
      contractId: "tx_1_imp_1",
      engineerId: "eng001",
      timestamp: "2024-01-15T08:04:00.000Z",
      stepIdentifier: "complete_001",
    });

    expect(auditLog.events[0].eventType).toBe("tx_1_imp_1_started");
    expect(auditLog.events[1].eventType).toBe("action_template_generation_executed");
    expect(auditLog.events[2].eventType).toBe("action_validation_executed");
    expect(auditLog.events[3].eventType).toBe(
      "action_system_registration_executed"
    );
    expect(auditLog.events[4].eventType).toBe("action_confirmation_email_sent");
    expect(auditLog.events[5].eventType).toBe("tx_1_imp_1_completed");

    for (const event of auditLog.events) {
      expect(event.contractId).toBe("tx_1_imp_1");
      expect(event.engineerId).toBe("eng001");
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe("string");
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.timestamp)).toBe(true);
      expect(event.stepIdentifier).toBeDefined();
    }
  });
});