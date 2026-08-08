import { type Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";

interface ExtractedReport {
  employeeId: string;
  date: string;
  yesterday: string;
  today: string;
  issues: string;
  extractedAt: string;
  extractionStatus: "success" | "failure";
}

interface MockAiClientState {
  extractedReports: ExtractedReport[];
  actionSequence: string[];
}

interface MockEmail {
  employeeId: string;
  senderEmail: string;
  receivedAt: string;
  body: string;
}

describe("Tx4Imp1Agent - 日報収集から課題抽出・優先度判定までの自動実行", () => {
  let mockAiClientState: MockAiClientState;
  let mockEmails: MockEmail[];

  beforeEach(() => {
    mockAiClientState = {
      extractedReports: [],
      actionSequence: [],
    };

    mockEmails = [
      {
        employeeId: "ENG001",
        senderEmail: "eng001@company.com",
        receivedAt: "2024-01-15T08:30:00Z",
        body:
          "【昨日やったこと】\nバグ修正PR#1234のレビュー対応\n【今日やること】\n新機能XのUIテスト実施\n【抱えている課題】\nDB接続タイムアウト問題が未解決",
      },
      {
        employeeId: "ENG002",
        senderEmail: "eng002@company.com",
        receivedAt: "2024-01-15T08:35:00Z",
        body:
          "【昨日やったこと】\nAPI仕様書の作成\n【今日やること】\nエンドポイント実装の開始\n【抱えている課題】\n外部API仕様の確認待ち状態",
      },
      {
        employeeId: "ENG003",
        senderEmail: "eng003@company.com",
        receivedAt: "2024-01-15T08:40:00Z",
        body:
          "【昨日やったこと】\nユニットテストの完成度向上\n【今日やること】\n統合テスト環境構築\n【抱えている課題】\nテスト環境のリソース不足",
      },
      {
        employeeId: "ENG004",
        senderEmail: "eng004@company.com",
        receivedAt: "2024-01-15T08:45:00Z",
        body:
          "【昨日やったこと】\nデプロイメントスクリプト改善\n【今日やること】\nステージング環境での動作確認\n【抱えている課題】\n本番環境への昇格テストが未実施",
      },
      {
        employeeId: "ENG005",
        senderEmail: "eng005@company.com",
        receivedAt: "2024-01-15T08:50:00Z",
        body:
          "【昨日やったこと】\nドキュメント更新\n【今日やること】\n開発チームへの説明会準備\n【抱えている課題】\n図表の作成ツールライセンス更新必要",
      },
    ];
  });

  afterEach(() => {
    mockAiClientState.extractedReports = [];
    mockAiClientState.actionSequence = [];
  });

  // SCEN-571
  test("should execute autonomous action 'read-daily-report-from-email' and extract 3-field data from 5 received emails with success status", async () => {
    // Arrange: Prepare mock AI client that simulates email parsing
    const mockAiClient: Tx4Imp1AiClient = {
      sendConfirmationEmail: async () => {
        mockAiClientState.actionSequence.push("send-confirmation-email");
        return { success: true, messageId: "msg-001" };
      },

      readReportFromEmailBatch: async (emails: MockEmail[]) => {
        mockAiClientState.actionSequence.push("read-email-batch");

        // Parse 3-field structure from email body
        const results: ExtractedReport[] = emails.map((email) => {
          const yesterdayMatch = email.body.match(
            /【昨日やったこと】\n(.+?)(?=\n【|$)/s
          );
          const todayMatch = email.body.match(/【今日やること】\n(.+?)(?=\n【|$)/s);
          const issuesMatch = email.body.match(
            /【抱えている課題】\n(.+?)(?=\n【|$)/s
          );

          const yesterday = yesterdayMatch ? yesterdayMatch[1].trim() : "";
          const today = todayMatch ? todayMatch[1].trim() : "";
          const issues = issuesMatch ? issuesMatch[1].trim() : "";

          const isValid =
            yesterday.length > 0 && today.length > 0 && issues.length > 0;

          return {
            employeeId: email.employeeId,
            date: "2024-01-15",
            yesterday,
            today,
            issues,
            extractedAt: email.receivedAt,
            extractionStatus: isValid ? "success" : "failure",
          };
        });

        mockAiClientState.extractedReports.push(...results);
        return results;
      },

      aggregateProgress: async () => {
        mockAiClientState.actionSequence.push("aggregate-progress");
        return { aggregationId: "agg-001", itemCount: 5 };
      },

      extractIssues: async () => {
        mockAiClientState.actionSequence.push("extract-issues");
        return { issueCount: 5 };
      },

      judgePriority: async () => {
        mockAiClientState.actionSequence.push("judge-priority");
        return { priorityListId: "prio-001" };
      },
    };

    // Act: Execute orchestrator with mock AI client
    const orchestratorResult = await runTx4Imp1Agent(
      mockAiClient,
      mockEmails
    );

    // Assert: Verify autonomous action sequence
    expect(mockAiClientState.actionSequence).toContain(
      "send-confirmation-email"
    );
    expect(mockAiClientState.actionSequence).toContain("read-email-batch");
    const emailIndex = mockAiClientState.actionSequence.indexOf(
      "send-confirmation-email"
    );
    const readIndex = mockAiClientState.actionSequence.indexOf(
      "read-email-batch"
    );
    expect(readIndex).toBeGreaterThan(emailIndex);

    // Assert: Verify all 5 emails extracted successfully
    expect(mockAiClientState.extractedReports).toHaveLength(5);

    // Assert: Verify each report has success status and all 3 fields non-empty
    mockAiClientState.extractedReports.forEach((report, index) => {
      expect(report.extractionStatus).toBe("success");
      expect(report.yesterday).not.toBe("");
      expect(typeof report.yesterday).toBe("string");
      expect(report.today).not.toBe("");
      expect(typeof report.today).toBe("string");
      expect(report.issues).not.toBe("");
      expect(typeof report.issues).toBe("string");
      expect(report.employeeId).toBe(`ENG${String(index + 1).padStart(3, "0")}`);
      expect(report.date).toBe("2024-01-15");
      expect(report.extractedAt).toBeDefined();
    });

    // Assert: Verify specific extraction content for first employee
    const firstReport = mockAiClientState.extractedReports[0];
    expect(firstReport.yesterday).toMatch(/バグ修正/);
    expect(firstReport.today).toMatch(/UIテスト/);
    expect(firstReport.issues).toMatch(/タイムアウト/);

    // Assert: Verify specific extraction content for second employee
    const secondReport = mockAiClientState.extractedReports[1];
    expect(secondReport.yesterday).toMatch(/API仕様書/);
    expect(secondReport.today).toMatch(/エンドポイント/);
    expect(secondReport.issues).toMatch(/外部API/);

    // Assert: Verify specific extraction content for third employee
    const thirdReport = mockAiClientState.extractedReports[2];
    expect(thirdReport.yesterday).toMatch(/ユニットテスト/);
    expect(thirdReport.today).toMatch(/統合テスト/);
    expect(thirdReport.issues).toMatch(/リソース不足/);

    // Assert: Verify specific extraction content for fourth employee
    const fourthReport = mockAiClientState.extractedReports[3];
    expect(fourthReport.yesterday).toMatch(/デプロイメント/);
    expect(fourthReport.today).toMatch(/ステージング/);
    expect(fourthReport.issues).toMatch(/本番環境/);

    // Assert: Verify specific extraction content for fifth employee
    const fifthReport = mockAiClientState.extractedReports[4];
    expect(fifthReport.yesterday).toMatch(/ドキュメント/);
    expect(fifthReport.today).toMatch(/説明会/);
    expect(fifthReport.issues).toMatch(/ライセンス/);

    // Assert: Verify orchestrator trace indicates correct action progression
    expect(orchestratorResult.success).toBe(true);
    expect(orchestratorResult.reportCount).toBe(5);
    expect(orchestratorResult.allSuccessful).toBe(true);
  });
});