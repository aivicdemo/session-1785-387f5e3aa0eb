import { validateSession } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-057: [error] ユーザー認証機能 - セッション情報が空オブジェクトのときエラーとなる", () => {
    const emptySession = {};

    expect(() => validateSession(emptySession)).toThrow(/セッション/);
  });
});