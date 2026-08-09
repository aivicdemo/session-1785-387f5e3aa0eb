import {
  runTx1Imp1Agent,
  type Tx1Imp1AiClient,
  type Tx1Imp1AiResponse,
} from "../../src/logic/it-1";

// Mock AI client for testing
class MockTx1Imp1AiClient implements Tx1Imp1AiClient {
  private responseOverride: Tx1Imp1AiResponse | null = null;

  setResponseOverride(response: Tx1Imp1AiResponse): void {
    this.responseOverride = response;
  }

  async validateAndProcessReport(
    input: unknown
  ): Promise<Tx1Imp1AiResponse> {
    if (this.responseOverride) {
      return this.responseOverride;
    }
    return {
      confidence: 1.0,
      isValid: true,
      content: JSON.stringify({
        yesterday: "sample",
        today: "sample",
        issues: "sample",
      }),
      metadata: {
        processedAt: new Date("2024-01-15T09:00:00Z"),
        modelVersion: "v1.0",
      },
    };
  }
}

// Mock database and email service
interface MockDatabaseConnection {
  insertReport: jest.Mock;
  rollback: jest.Mock;
  getReportStatus: jest.Mock;
}

interface MockEmailService {
  sendConfirmationEmail: jest.Mock;
}

interface MockAuditLogger {
  logEscalation: jest.Mock;
  logError: jest.Mock;
}

interface MockEscalationNotifier {
  notifyHumanReviewer: jest.Mock;
}

const createMockDatabase = (): MockDatabaseConnection => ({
  insertReport: jest.fn().mockResolvedValue({ id: "rpt_001" }),
  rollback: jest.fn().mockResolvedValue(undefined),
  getReportStatus: jest.fn().mockResolvedValue("not_registered"),
});

const createMockEmailService = (): MockEmailService => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue({ messageId: "msg_001" }),
});

const createMockAuditLogger = (): MockAuditLogger => ({
  logEscalation: jest.fn().mockResolvedValue(undefined),
  logError: jest.fn().mockResolvedValue(undefined),
});

const createMockEscalationNotifier =
  (): MockEscalationNotifier => ({
    notifyHumanReviewer: jest.fn().mockResolvedValue({ notificationId: "esc_001" }),
  });

describe("tx-1-imp-1: 日報入力から送信・確認メール配信までの自動化 - AI出力不正・曖昧・低確信度の安全な引き継ぎ", () => {
  let mockAiClient: MockTx1Imp1AiClient;
  let mockDatabase: MockDatabaseConnection;
  let mockEmailService: MockEmailService;
  let mockAuditLogger: MockAuditLogger;
  let mockEscalationNotifier: MockEscalationNotifier;

  beforeEach(() => {
    mockAiClient = new MockTx1Imp1AiClient();
    mockDatabase = createMockDatabase();
    mockEmailService = createMockEmailService();
    mockAuditLogger = createMockAuditLogger();
    mockEscalationNotifier = createMockEscalationNotifier();
  });

  // SCEN-536
  test("不正・曖昧・低確信度のAI出力を拒否してエスカレーション通知を送信し、日報登録を実行しない", async () => {
    // Arrange: 低確信度（confidence < 0.7）で曖昧なAI出力を設定
    const lowConfidenceResponse: Tx1Imp1AiResponse = {
      confidence: 0.65,
      isValid: false,
      content: JSON.stringify({
        yesterday: null,
        today: "",
        issues: "unclear",
      }),
      metadata: {
        processedAt: new Date("2024-01-15T09:00:00Z"),
        modelVersion: "v1.0",
      },
    };
    mockAiClient.setResponseOverride(lowConfidenceResponse);

    const reportInput = {
      engineerId: "eng_001",
      engineerName: "田中太郎",
      engineerEmail: "tanaka@example.com",
      departmentId: "dev_001",
      departmentName: "開発部",
      managerEmail: "manager@example.com",
      submissionTimestamp: new Date("2024-01-15T09:15:00Z"),
      yesterday: null,
      today: "",
      issues: "undefined content",
    };

    // Act: オーケストレータを実行
    const result = await runTx1Imp1Agent(
      reportInput,
      mockAiClient,
      mockDatabase as any,
      mockEmailService as any,
      mockAuditLogger as any,
      mockEscalationNotifier as any
    );

    // Assert: エスカレーション判定が実行されたことを確認
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationReason).toMatch(
      /不正・曖昧・低確信度/
    );

    // Assert: 日報が管理システムに登録されていないことを確認
    expect(mockDatabase.insertReport).not.toHaveBeenCalled();

    // Assert: 確認メールが送信されていないことを確認
    expect(mockEmailService.sendConfirmationEmail).not.toHaveBeenCalled();

    // Assert: エラーログに『AI出力が不正・曖昧・低確信度のため処理中断』と記録されたことを確認
    expect(mockAuditLogger.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/AI出力が不正・曖昧・低確信度のため処理中断/),
        engineerId: "eng_001",
        timestamp: expect.any(Date),
      })
    );

    // Assert: エスカレーション通知が人間レビュー担当者に送信されたことを確認
    expect(mockEscalationNotifier.notifyHumanReviewer).toHaveBeenCalledWith(
      expect.objectContaining({
        engineerId: "eng_001",
        engineerName: "田中太郎",
        engineerEmail: "tanaka@example.com",
        managerEmail: "manager@example.com",
        reason: expect.stringMatching(/confidence|曖昧|不正/),
        timestamp: expect.any(Date),
      })
    );

    // Assert: 当該エンジニアの日報ステータスが『未登録』のままであることを確認
    expect(mockDatabase.getReportStatus).toHaveBeenCalledWith("eng_001", expect.any(Date));
    const reportStatus = await mockDatabase.getReportStatus(
      "eng_001",
      new Date("2024-01-15T09:15:00Z")
    );
    expect(reportStatus).toBe("not_registered");

    // Assert: ロールバック処理が実行されたことを確認
    expect(mockDatabase.rollback).toHaveBeenCalled();

    // Assert: エスカレーション通知にタイムスタンプ、エンジニア名、不正内容の理由が含まれることを確認
    const escalationCall = mockEscalationNotifier.notifyHumanReviewer.mock.calls[0][0];
    expect(escalationCall).toHaveProperty("timestamp");
    expect(escalationCall.timestamp).toBeInstanceOf(Date);
    expect(escalationCall.engineerName).toBe("田中太郎");
    expect(escalationCall.reason).toBeDefined();
    expect(escalationCall.reason.length).toBeGreaterThan(0);

    // Assert: 重複登録や部分的な状態遷移がないことを確認
    expect(mockDatabase.insertReport).toHaveBeenCalledTimes(0);
    expect(mockEmailService.sendConfirmationEmail).toHaveBeenCalledTimes(0);

    // Assert: システム状態が完全にロールバックされたことを確認
    expect(result.status).toBe("escalated");
    expect(result.reportRegistered).toBe(false);
    expect(result.confirmationEmailSent).toBe(false);
  });
});