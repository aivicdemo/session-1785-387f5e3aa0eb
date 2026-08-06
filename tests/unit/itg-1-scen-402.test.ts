import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { endPromptionLoopIfNoResponseWithinTimeframe } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  // SCEN-402
  test("催促メール送信後、一定時間内に再報告がない場合、催促ループを終了する", () => {
    // Arrange: 初期状態の設定
    const employee_id = "EMP_A";
    const promption_sent_at = new Date("2024-01-15T09:00:00Z");
    const current_time = new Date("2024-01-15T10:00:00Z");
    const max_wait_time_minutes = 60;
    const has_resubmitted = false;

    // Act: 催促ループ終了判定ロジックを実行
    const result = endPromptionLoopIfNoResponseWithinTimeframe({
      employee_id,
      promption_sent_at,
      current_time,
      max_wait_time_minutes,
      has_resubmitted,
    });

    // Assert: 催促ループがstatus 'ended' で終了していることを検証
    expect(result.status).toBe("ended");
    expect(result.employee_id).toBe(employee_id);
    expect(result.should_send_additional_prompt).toBe(false);
    expect(result.elapsed_minutes).toBe(60);
  });
});