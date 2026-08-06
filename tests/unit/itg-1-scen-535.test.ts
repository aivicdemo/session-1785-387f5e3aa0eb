import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";

const fetchMock = require("jest-fetch-mock");

interface FakeTx1Imp1AiClient {
  generateTemplate: jest.Mock;
  receiveEngineerInput: jest.Mock;
  validateInput: jest.Mock;
}

interface EngineerInput {
  engineerId: string;
  yesterdayAccomplishment: string;
  todayPlan: string;
  challenge: string;
}

interface AuditLogEntry {
  timestamp: string;
  engineerId: string;
  eventType: string;
  errorDetails: string;
  escalationNotificationSent: boolean;
}

interface SystemState {
  auditLog: AuditLogEntry[];
  registeredReports: Map<string, EngineerInput>;
}

describe("日報入力から送信・確認メール配信までの自動化 - システムエラーエスカレーション", () => {
  let systemState: SystemState;
  let fakeAiClient: FakeTx1Imp1AiClient;
  let escalationNotificationSent: boolean;
  let escalationNotificationContent: {
    reason: string;
    engineerId: string;
    reportData: EngineerInput;
    recommendedAction: string;
  } | null;

  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    systemState = {
      auditLog: [],
      registeredReports: new Map(),
    };

    escalationNotificationSent = false;
    escalationNotificationContent = null;

    fakeAiClient = {
      generateTemplate: jest.fn().mockResolvedValue({
        templateId: "template-001",
        status: "success",
      }),
      receiveEngineerInput: jest.fn().mockResolvedValue({
        engineerId: "engineer-001",
        yesterdayAccomplishment: "バグ修正完了",
        todayPlan: "機能開発",
        challenge: "なし",
      }),
      validateInput: jest.fn().mockResolvedValue({
        isValid: true,
        validationErrors: [],
      }),
    };
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-535
  test("should escalate to manager when report registration API returns system error (HTTP 500) before confirmation email delivery", async () => {
    const engineerInput: EngineerInput = {
      engineerId: "engineer-001",
      yesterdayAccomplishment: "バグ修正完了",
      todayPlan: "機能開発",
      challenge: "なし",
    };

    const registrationAttemptTime = new Date("2024-01-15T08:00:00Z");
    const expectedAuditTimestamp = "2024-01-15T08:00:00Z";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Internal Server Error",
        code: "REGISTRATION_FAILED",
      }),
      { status: 500 }
    );

    let registrationError: Error | null = null;
    let confirmationEmailSent = false;
    let escalationTriggered = false;

    try {
      await runTx1Imp1Agent(
        engineerInput,
        fakeAiClient,
        {
          onRegistrationError: (error: Error) => {
            registrationError = error;
            escalationTriggered = true;
            escalationNotificationSent = true;
            escalationNotificationContent = {
              reason: "日報登録システムエラー",
              engineerId: "engineer-001",
              reportData: engineerInput,
              recommendedAction:
                "手動での日報登録確認と確認メール再配信が必要",
            };
            systemState.auditLog.push({
              timestamp: expectedAuditTimestamp,
              engineerId: "engineer-001",
              eventType: "ESCALATION_TRIGGERED",
              errorDetails:
                "HTTP 500: Internal Server Error - REGISTRATION_FAILED",
              escalationNotificationSent: true,
            });
          },
          onConfirmationEmailSent: () => {
            confirmationEmailSent = true;
          },
        }
      );
    } catch (error) {
      registrationError = error as Error;
    }

    expect(escalationTriggered).toBe(true);
    expect(escalationNotificationSent).toBe(true);
    expect(confirmationEmailSent).toBe(false);

    expect(escalationNotificationContent).toEqual({
      reason: "日報登録システムエラー",
      engineerId: "engineer-001",
      reportData: {
        engineerId: "engineer-001",
        yesterdayAccomplishment: "バグ修正完了",
        todayPlan: "機能開発",
        challenge: "なし",
      },
      recommendedAction: "手動での日報登録確認と確認メール再配信が必要",
    });

    expect(systemState.auditLog.length).toBe(1);
    expect(systemState.auditLog[0]).toEqual({
      timestamp: expectedAuditTimestamp,
      engineerId: "engineer-001",
      eventType: "ESCALATION_TRIGGERED",
      errorDetails: "HTTP 500: Internal Server Error - REGISTRATION_FAILED",
      escalationNotificationSent: true,
    });

    expect(systemState.registeredReports.has("engineer-001")).toBe(false);

    const fetchCalls = fetchMock.mock.calls;
    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0][0]).toContain("/api/reports/register");
    expect(fetchCalls[0][1].method).toBe("POST");
  });
});