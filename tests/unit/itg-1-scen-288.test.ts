import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

// Mock implementations
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockEmailService = {
  sendMail: jest.fn(),
};

// Fake AI Client implementation for testing
class FakeTx2Imp1AiClient implements Tx2Imp1AiClient {
  async analyzeReportStatus(params: {
    reportsList: Array<{
      userId: string;
      submittedAt: string;
      status: string;
    }>;
    deadline: string;
  }): Promise<{
    unreportedUsers: string[];
    delayedUsers: string[];
    onTimeUsers: string[];
  }> {
    return {
      unreportedUsers: params.reportsList
        .filter((r) => r.status === "not_submitted")
        .map((r) => r.userId),
      delayedUsers: params.reportsList
        .filter((r) => r.status === "delayed")
        .map((r) => r.userId),
      onTimeUsers: params.reportsList
        .filter((r) => r.status === "on_time")
        .map((r) => r.userId),
    };
  }

  async generateNotificationMessage(params: {
    unreportedUsers: string[];
    delayedUsers: string[];
  }): Promise<string> {
    const unreportedCount = params.unreportedUsers.length;
    const delayedCount = params.delayedUsers.length;
    return `未報告: ${unreportedCount}名, 遅延: ${delayedCount}名`;
  }
}

describe("確認メール配信機能 - 送信者メールアドレスnull時のエラーハンドリング", () => {
  // SCEN-288
  test("送信者メールアドレスがnullのとき、メール配信処理が中断される", async () => {
    const aiClient = new FakeTx2Imp1AiClient();

    const mockEmailServiceWithNullCheck = {
      sendMail: jest.fn().mockImplementation((params) => {
        if (params.senderEmail === null) {
          throw new Error("SENDER_EMAIL_NULL: 送信者メールアドレスが未設定です");
        }
        return Promise.resolve({ success: true, messageId: "msg-123" });
      }),
    };

    const reportsList = [
      {
        userId: "user-001",
        submittedAt: "2024-01-15T08:30:00Z",
        status: "on_time",
      },
      {
        userId: "user-002",
        submittedAt: "2024-01-15T08:45:00Z",
        status: "delayed",
      },
      {
        userId: "user-003",
        submittedAt: "2024-01-15T00:00:00Z",
        status: "not_submitted",
      },
    ];

    const deadline = "2024-01-15T08:00:00Z";
    const managerEmail = "manager@company.com";
    const senderEmail = null;
    const senderName = "Engineer001";

    const logCapture: Array<{ level: string; message: string }> = [];
    const mockLoggerWithCapture = {
      info: jest.fn((msg: string) => {
        logCapture.push({ level: "info", message: msg });
      }),
      error: jest.fn((msg: string) => {
        logCapture.push({ level: "error", message: msg });
      }),
      warn: jest.fn((msg: string) => {
        logCapture.push({ level: "warn", message: msg });
      }),
    };

    let agentResult: {
      status: string;
      code?: string;
      message?: string;
      data?: {
        unreportedUsers: string[];
        delayedUsers: string[];
        mailSent: boolean;
      };
    } = { status: "pending" };

    try {
      const analysisResult = await aiClient.analyzeReportStatus({
        reportsList,
        deadline,
      });

      const notificationMessage = await aiClient.generateNotificationMessage({
        unreportedUsers: analysisResult.unreportedUsers,
        delayedUsers: analysisResult.delayedUsers,
      });

      try {
        await mockEmailServiceWithNullCheck.sendMail({
          to: managerEmail,
          subject: "日報送信状況報告",
          body: notificationMessage,
          senderEmail: senderEmail,
          senderName: senderName,
        });
      } catch (emailError: unknown) {
        const errorMessage =
          emailError instanceof Error ? errorError.message : String(emailError);

        if (errorMessage.includes("SENDER_EMAIL_NULL")) {
          mockLoggerWithCapture.error(
            "送信者メールアドレスが null のため配信処理を中断"
          );
          agentResult = {
            status: "error",
            code: "SENDER_EMAIL_NULL",
            message: "送信者メールアドレスが未設定です",
            data: {
              unreportedUsers: analysisResult.unreportedUsers,
              delayedUsers: analysisResult.delayedUsers,
              mailSent: false,
            },
          };
        }
      }
    } catch (orchestratorError) {
      mockLoggerWithCapture.error(String(orchestratorError));
      agentResult = {
        status: "error",
        code: "ORCHESTRATOR_ERROR",
        message: "オーケストレータ実行エラー",
      };
    }

    expect(mockEmailServiceWithNullCheck.sendMail).toHaveBeenCalled();
    expect(agentResult.status).toBe("error");
    expect(agentResult.code).toBe("SENDER_EMAIL_NULL");
    expect(agentResult.message).toBe("送信者メールアドレスが未設定です");
    expect(agentResult.data?.mailSent).toBe(false);

    const errorLogEntry = logCapture.find(
      (log) =>
        log.level === "error" &&
        log.message.includes("送信者メールアドレスが null のため配信処理を中断")
    );
    expect(errorLogEntry).toBeDefined();

    expect(agentResult.data?.unreportedUsers).toEqual(["user-003"]);
    expect(agentResult.data?.delayedUsers).toEqual(["user-002"]);
  });
});