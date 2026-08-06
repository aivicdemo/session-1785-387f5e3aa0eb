import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateReminder } from "../../src/logic/it-1-br-1-1-1";

describe("未報告催促メール通知機能", () => {
  // SCEN-513: [error] 未報告催促メール通知機能 - 未報告部員名リストが空配列で催促メッセージ生成に失敗する
  test("should throw error when unreported_members list is empty", () => {
    const unreported_members: string[] = [];

    expect(() => generateReminder(unreported_members)).toThrow(/未報告部員/);
  });
});