import { describe, test, expect } from "@jest/globals";
import { checkPromptLoopTerminationCondition } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  // SCEN-413
  test("規定催促回数上限が null のときエラーを返す", () => {
    const max_prompt_attempts = null;
    const current_prompt_count = 1;
    const last_response_received_at = new Date("2024-01-15T10:30:00Z");
    const timeout_minutes = 30;

    expect(() =>
      checkPromptLoopTerminationCondition({
        max_prompt_attempts,
        current_prompt_count,
        last_response_received_at,
        timeout_minutes,
      })
    ).toThrow(/規定催促回数上限/);
  });
});