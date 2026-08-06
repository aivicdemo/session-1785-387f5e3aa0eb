import { determineShouldStopPromptingLoop } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  // SCEN-421
  test("催促試行回数が規定回数上限を超えている場合、上限値として機能する", () => {
    const max_retry_count = 5;
    const actual_retry_count = 7;

    const result = determineShouldStopPromptingLoop(
      actual_retry_count,
      max_retry_count
    );

    expect(result).toBe(true);
  });
});