import { describe, test, expect } from "@jest/globals";
import { initializeReportArrivalStatus, validateExpectedReporterCount } from "../../src/logic/it-1-br-1-1-1";

// SCEN-462
describe("報告送信時の確認メール自動配信機能 - 期待報告人数バリデーション", () => {
  test("期待報告人数が負数のとき、バリデーションエラーが発生する", () => {
    const invalidExpectedReporterCount = -5;

    expect(() => {
      validateExpectedReporterCount(invalidExpectedReporterCount);
    }).toThrow(/期待報告人数は0以上/);
  });
});