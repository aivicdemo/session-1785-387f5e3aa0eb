import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-056: [error] ユーザー認証機能 - セッション情報が null のときエラーとなる
  test("should redirect to login and display error message when session is null", async () => {
    const { validateSessionAndGetUser } = await import(
      "../../src/logic/it-1"
    );

    const nullSession = null;
    const userId = "user-001";

    expect(() => {
      validateSessionAndGetUser(nullSession, userId);
    }).toThrow(/セッション/);
  });
});