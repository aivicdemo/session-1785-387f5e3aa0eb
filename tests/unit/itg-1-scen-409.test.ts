import { describe, test, expect } from "@jest/globals";
import { determinePushLoopTermination } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  test("SCEN-409: [error] 催促対象部員IDが null のときエラーになる", () => {
    const push_target_member_id = null;
    const push_attempt_count = 1;
    const max_push_attempts = 3;
    const last_push_sent_at = new Date("2024-01-15T08:00:00Z");
    const push_interval_minutes = 5;

    expect(() =>
      determinePushLoopTermination({
        push_target_member_id,
        push_attempt_count,
        max_push_attempts,
        last_push_sent_at,
        push_interval_minutes,
      })
    ).toThrow(/催促対象部員ID/);
  });
});