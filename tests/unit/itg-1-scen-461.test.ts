import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateExpectedReporterCount } from "../../src/logic/it-1-br-1-1-1";

describe("報告到着状況把握機能 - 期待報告人数バリデーション", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-461
  test("期待報告人数が0のとき、エラーになる", () => {
    const expectedReporterCount = 0;

    expect(() => {
      validateExpectedReporterCount(expectedReporterCount);
    }).toThrow(/期待報告人数/);
  });
});