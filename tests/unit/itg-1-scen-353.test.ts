import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateAllReportsCompleted } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-353
  test("全員報告完了判定機能 - 報告者データが null のとき、エラーが発生する", () => {
    const report_data = null;

    expect(() => {
      validateAllReportsCompleted(report_data);
    }).toThrow(/報告者/);
  });
});