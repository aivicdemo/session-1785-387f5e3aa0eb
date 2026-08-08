import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

// Mock logger for audit trail
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Fake AI Client implementation
class FakeTx2Imp1AiClient implements Tx2Imp1AiClient {
  sendConfirmationEmail = jest.fn();
  identifyMissingReports = jest.fn();
  notifyManager = jest.fn();

  constructor() {
    this.sendConfirmationEmail.mockResolvedValue({ success: true });
    this.identifyMissingReports.mockResolvedValue({
      missingReports: [],
      delayedReports: [],
    });
    this.notifyManager.mockResolvedValue({ notified: true });
  }
}

describe("確認メール配信機能 - 入力値検証", () => {
  let fakeAiClient: FakeTx2Imp1AiClient;

  beforeEach(() => {
    fakeAiClient = new FakeTx2Imp1AiClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-301
  test("部門IDが空文字のとき、メール配信処理が中断される", async () => {
    const input = {
      departmentId: "",
      managerEmail: "manager@example.com",
      missingReportMembers: [
        {
          userId: "ENG001",
          userName: "Engineer One",
          userEmail: "eng001@example.com",
          reportStatus: "missing" as const,
        },
      ],
      delayedReportMembers: [],
      scheduleTime: new Date("2024-01-15T09:00:00Z"),
      currentTime: new Date("2024-01-15T08:45:00Z"),
    };

    let thrownError: Error | null = null;

    try {
      await runTx2Imp1Agent(input, fakeAiClient, mockLogger);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/部門ID/);
    expect(fakeAiClient.sendConfirmationEmail).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("入力値検証エラー")
    );
  });
});