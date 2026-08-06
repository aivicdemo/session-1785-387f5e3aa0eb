import { describe, test, expect, beforeEach } from "@jest/globals";
import { prioritizePromptionTargets } from "../../src/logic/it-1-br-1-1-1";

describe("催促対象部員の優先順位付け機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-326
  test("遅延部員リストが null のとき null チェックエラーが発生する", () => {
    const delayedMemberList = null;
    const nonSubmittedMemberList = [
      {
        user_id: "USR002",
        user_name: "山田太郎",
      },
    ];

    expect(() =>
      prioritizePromptionTargets(nonSubmittedMemberList, delayedMemberList)
    ).toThrow(/遅延部員リスト/);
  });
});