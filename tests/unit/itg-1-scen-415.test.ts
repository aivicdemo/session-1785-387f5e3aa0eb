import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { determinePromptionLoopEnd } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-415
  test("最後の再報告受信時刻が null のときエラーになる", () => {
    const prompt_target_user_id = "user_001";
    const prompt_round_number = 2;
    const max_prompt_attempts = 3;
    const last_report_received_at = null;
    const prompt_deadline = new Date("2024-01-15T09:00:00Z");

    expect(() =>
      determinePromptionLoopEnd({
        prompt_target_user_id,
        prompt_round_number,
        max_prompt_attempts,
        last_report_received_at,
        prompt_deadline,
      })
    ).toThrow(/最後の再報告受信時刻/);
  });
});