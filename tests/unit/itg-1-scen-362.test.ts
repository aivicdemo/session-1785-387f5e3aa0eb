import { describe, test, expect, beforeEach } from "@jest/globals";
import { judgeAllReportingComplete } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-362
  test("全員報告完了判定機能 - 未報告者リストが null のとき、エラーが発生する", () => {
    const non_reported_list = null;

    expect(() => {
      judgeAllReportingComplete(non_reported_list as any);
    }).toThrow(/未報告者リスト|配列/);
  });
});