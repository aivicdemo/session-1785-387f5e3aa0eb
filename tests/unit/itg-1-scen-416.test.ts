import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateAndInitializePromptTimeout } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能 - promptTimeoutInterval null チェック", () => {
  // SCEN-416
  test("催促タイムアウト待機時間が null のときエラーになる", () => {
    const nullTimeoutInterval = null;

    expect(() => {
      validateAndInitializePromptTimeout(nullTimeoutInterval);
    }).toThrow(/promptTimeoutInterval/);
  });
});