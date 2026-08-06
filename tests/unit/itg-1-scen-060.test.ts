import { login } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-060
  test("ユーザーID が未定義のときエラーとなる", () => {
    expect(() => login(undefined as any)).toThrow(/ユーザーID/);
  });
});