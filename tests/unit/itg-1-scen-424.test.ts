import { describe, test, expect } from "@jest/globals";
import { notifyUnsubmittedMembers } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に未提出部員通知機能", () => {
  test("SCEN-424: 未提出部員情報リストが空配列のときエラーになる", () => {
    const unsubmittedMembers = [];

    expect(() => notifyUnsubmittedMembers(unsubmittedMembers)).toThrow(
      /未提出部員/
    );
  });
});