import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import { Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/types";

// Mock types and interfaces
interface MockAiClientOutput {
  yesterdayAccomplishment: string;
  todayPlan: string;
  currentChallenge: string;
  validationStatus: {
    completeness: "OK" | "NG";
    appropriateness: "OK" | "NG";
  };
}

interface RegistrationResponse {
  reportId: string;
  timestamp: string;
}

interface OrchestrationResult {
  status: "SUCCESS" | "FAILURE";
  reportId?: string;
  timestamp?: string;
  auditLog: AuditLogEntry[];
  internalState: {
    actionStatus: string;
  };
}

interface AuditLogEntry {
  autonomousAction: string;
  status: "SUCCESS" | "FAILURE";
  engineerId: string;
  inputValidation: string;
  registrationId?: string;
  timestamp: string;
}

// SCEN-528: [normal] 日報入力から送信・確認メール配信までの自動化 AIエージェント - 「エンジニアの入力内容を受け取る」を契約どおり実行する
describe("朝会報告管理システム - 日報入力フォームの提供と送信機能", () => {
  test("SCEN-528: AIエージェントが日報入力内容を正常に受け取り、検証・登録を完遂する", async () => {
    // Arrange: モック AI クライアントの準備
    const mockAiClient: Partial<Tx1Imp1AiClient> = {
      extractReportInput: async () => ({
        yesterdayAccomplishment: "バグ修正PR#1234 をレビュー・マージ",
        todayPlan: "API 仕様書作成",
        currentChallenge: "DB スキーマ設計の決定待ち",
      } as MockAiClientOutput),
      validateReportInput: async () => ({
        completeness: "OK",
        appropriateness: "OK",
      }),
    };

    // Arrange: スタブ日報登録サービスの準備
    const stubRegistrationService = {
      registerReport: async (input: {
        engineerId: string;
        yesterdayAccomplishment: string;
        todayPlan: string;
        currentChallenge: string;
      }): Promise<RegistrationResponse> => ({
        reportId: "tx_1_20250115_eng001",
        timestamp: "2025-01-15T08:30:00Z",
      }),
    };

    // Arrange: エンジニアIDとタイムスタンプの固定値
    const engineerId = "eng001";
    const executionTimestamp = "2025-01-15T08:30:00Z";

    // Act: オーケストレータ関数を実行
    const result: OrchestrationResult = await runTx1Imp1Agent(
      mockAiClient as Tx1Imp1AiClient,
      stubRegistrationService,
      {
        engineerId,
        executionTimestamp,
      }
    );

    // Assert: ステータスが SUCCESS である
    expect(result.status).toBe("SUCCESS");

    // Assert: 日報 ID が正しく割り当てられている
    expect(result.reportId).toBe("tx_1_20250115_eng001");

    // Assert: タイムスタンプが登録されている
    expect(result.timestamp).toBe("2025-01-15T08:30:00Z");

    // Assert: 内部状態に『入力内容受け取り完了』が記録されている
    expect(result.internalState.actionStatus).toBe("入力内容受け取り完了");

    // Assert: 監査ログが記録されている
    expect(result.auditLog).toHaveLength(1);
    const auditEntry: AuditLogEntry = result.auditLog[0];

    // Assert: 監査ログの自律処理アクションが正しく記録されている
    expect(auditEntry.autonomousAction).toBe(
      "エンジニアの入力内容を受け取る"
    );

    // Assert: 監査ログのステータスが SUCCESS である
    expect(auditEntry.status).toBe("SUCCESS");

    // Assert: 監査ログにエンジニア ID が記録されている
    expect(auditEntry.engineerId).toBe("eng001");

    // Assert: 監査ログの入力検証が PASSED である
    expect(auditEntry.inputValidation).toBe("PASSED");

    // Assert: 監査ログに登録 ID が記録されている
    expect(auditEntry.registrationId).toBe("tx_1_20250115_eng001");

    // Assert: 次ステップへの進行が可能な状態（internalState.actionStatus が入力内容受け取り完了）
    expect(result.internalState.actionStatus).toBe("入力内容受け取り完了");
  });
});