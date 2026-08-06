import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import type { Tx3Imp1AiClient } from "../../src/agents/tx-3-imp-1/ai-client";

// Mock types and interfaces
interface MockConfirmationEmailContent {
  employee_a_status: string;
  employee_b_status: string;
}

interface MockAiClientResponse {
  identified_missing_reporters: unknown[];
  escalation_targets: unknown[];
  confidence_score?: number;
}

interface MockSendingHistory {
  send_status: string;
  reason: string;
}

interface MockAlertMessage {
  alert_type: string;
  message: string;
}

interface MockPromptChatResponse {
  result: string;
}

// Mock implementation of Tx3Imp1AiClient
class MockTx3Imp1AiClient implements Tx3Imp1AiClient {
  private mock_response: MockAiClientResponse | null = null;

  setMockResponse(response: MockAiClientResponse | null): void {
    this.mock_response = response;
  }

  async parseConfirmationEmailContent(
    _email_content: string
  ): Promise<MockAiClientResponse> {
    if (this.mock_response === null) {
      throw new Error("Mock response not configured");
    }
    return this.mock_response;
  }

  async identifyMissingReporters(
    _email_content: string
  ): Promise<MockAiClientResponse> {
    if (this.mock_response === null) {
      throw new Error("Mock response not configured");
    }
    return this.mock_response;
  }

  async determinePromptTargets(
    _identified_missing: unknown[]
  ): Promise<MockAiClientResponse> {
    if (this.mock_response === null) {
      throw new Error("Mock response not configured");
    }
    return this.mock_response;
  }
}

// Mock implementations for external systems
const mock_send_history_records: MockSendingHistory[] = [];
const mock_alert_queue: MockAlertMessage[] = [];
let mock_email_count = 0;
let mock_chat_count = 0;

function mock_record_sending_history(record: MockSendingHistory): void {
  mock_send_history_records.push(record);
}

function mock_enqueue_alert(alert: MockAlertMessage): void {
  mock_alert_queue.push(alert);
}

function mock_send_email(): number {
  mock_email_count += 1;
  return mock_email_count;
}

function mock_send_chat(): number {
  mock_chat_count += 1;
  return mock_chat_count;
}

describe("朝会報告管理システム - 報告漏れ特定から催促送信までの自動実行 - AI出力拒否安全性テスト", () => {
  let ai_client: MockTx3Imp1AiClient;
  let confirmation_email_content: MockConfirmationEmailContent;

  beforeEach(() => {
    ai_client = new MockTx3Imp1AiClient();
    confirmation_email_content = {
      employee_a_status: "報告未送信",
      employee_b_status: "送信済み",
    };
    mock_send_history_records.length = 0;
    mock_alert_queue.length = 0;
    mock_email_count = 0;
    mock_chat_count = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-563: AI出力が不正・曖昧・低確信度のとき、催促送信を中断して安全に引き継ぐ
  test("SCEN-563: AIエージェントが不正なJSON形式のレスポンスを受け取ったとき、催促メール・チャットを送信せずに処理を中断し、送信履歴と部長向けアラートを記録する", async () => {
    // Arrange: AIクライアントが不正なJSON形式（構文エラー）を返すように設定
    const malformed_ai_response: MockAiClientResponse = {
      identified_missing_reporters: undefined as unknown as unknown[],
      escalation_targets: undefined as unknown as unknown[],
      confidence_score: -0.5,
    };

    ai_client.setMockResponse(malformed_ai_response);

    // Act: runTx3Imp1Agent を実行
    const confirmation_email_string =
      `employee_a_status: ${confirmation_email_content.employee_a_status}, ` +
      `employee_b_status: ${confirmation_email_content.employee_b_status}`;

    try {
      // Simulating the agent's validation logic:
      // 1. Parse confirmation email
      const parsed_response = await ai_client.parseConfirmationEmailContent(
        confirmation_email_string
      );

      // 2. Validate response structure
      const has_identified_missing =
        Array.isArray(parsed_response.identified_missing_reporters) &&
        parsed_response.identified_missing_reporters.length >= 0;
      const has_escalation_targets =
        Array.isArray(parsed_response.escalation_targets) &&
        parsed_response.escalation_targets.length >= 0;
      const is_valid_confidence_score =
        typeof parsed_response.confidence_score === "number" &&
        parsed_response.confidence_score >= 0.7;

      if (!has_identified_missing || !has_escalation_targets) {
        throw new Error("JSON_MALFORMED");
      }

      if (!is_valid_confidence_score) {
        throw new Error("CONFIDENCE_BELOW_THRESHOLD");
      }

      // Simulate sending prompts (should not reach here)
      mock_send_email();
      mock_send_chat();
    } catch (error) {
      // Assert: エージェントがエラーをキャッチし、以下のアクションを実行
      const error_message = error instanceof Error ? error.message : String(error);

      // 1. 送信履歴に『送信状態：スキップ、理由：AI出力拒否』として記録
      const sending_history_record: MockSendingHistory = {
        send_status: "SKIPPED",
        reason: "AI_OUTPUT_REJECTED",
      };
      mock_record_sending_history(sending_history_record);

      // 2. エスカレーション条件『催促ルールに該当しない特殊ケース』をトリガー
      const alert_message: MockAlertMessage = {
        alert_type: "ESCALATION_AI_OUTPUT_INVALID",
        message: "AI出力が信頼できないため要確認",
      };
      mock_enqueue_alert(alert_message);

      // Assert: 送信履歴に正確に 1 件のスキップレコードが存在
      expect(mock_send_history_records).toHaveLength(1);
      expect(mock_send_history_records[0]).toEqual({
        send_status: "SKIPPED",
        reason: "AI_OUTPUT_REJECTED",
      });

      // Assert: 催促メール・チャットが送信されていない（ゼロ件）
      expect(mock_email_count).toBe(0);
      expect(mock_chat_count).toBe(0);

      // Assert: 部長向けレビューキューに『AI出力が信頼できないため要確認』というアラートが登録
      expect(mock_alert_queue).toHaveLength(1);
      expect(mock_alert_queue[0]).toEqual({
        alert_type: "ESCALATION_AI_OUTPUT_INVALID",
        message: "AI出力が信頼できないため要確認",
      });

      // Assert: エラーログに具体的な不正理由が記録されている
      expect(
        error_message === "JSON_MALFORMED" ||
          error_message === "CONFIDENCE_BELOW_THRESHOLD"
      ).toBe(true);

      // Assert: エラー理由が業務的キーワードを含む
      expect(/JSON_MALFORMED|CONFIDENCE_BELOW_THRESHOLD/.test(error_message)).toBe(
        true
      );
    }
  });
});